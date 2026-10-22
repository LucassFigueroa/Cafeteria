# =====================================================================
#  CoffeeFlow - Pruebas de carga y estres con Apache JMeter 5.6.3
#  Uso (PowerShell, dentro de la carpeta Cafeteria):
#     powershell -ExecutionPolicy Bypass -File .\pruebas-carga\ejecutar-jmeter.ps1
#  Requisitos previos:
#     1. cd front ; npx ng build --stats-json
#     2. cd front ; npx serve@14 -s dist/front/browser -l 8080   (sitio estatico, RNF-04)
#  Genera CoffeeFlow_carga_estres.jmx con los recursos reales del build y ejecuta:
#     - carga   : 50 usuarios concurrentes durante 120 s (demanda esperada)
#     - estres  : escalones de 100, 250, 500 y 1000 usuarios durante 60 s cada uno, y 1000 sin pausas
#  Cada escenario deja resultados.jtl y el reporte HTML de JMeter en resultados\<escenario>\
# =====================================================================

param(
    [string]$Servidor = 'localhost',
    [int]$Puerto = 8080,
    [switch]$SoloGenerar,
    [string[]]$Solo   # ejecuta solo estos escenarios (el resumen incluye todos los ya ejecutados)
)

$ErrorActionPreference = 'Stop'
$raiz       = Split-Path $PSScriptRoot -Parent
$navegador  = Join-Path $raiz 'front\dist\front\browser'
$stats      = Join-Path $raiz 'front\dist\front\stats.json'
$jmeter     = Join-Path $raiz 'herramientas\apache-jmeter-5.6.3\bin\jmeter.bat'
$plan       = Join-Path $PSScriptRoot 'CoffeeFlow_carga_estres.jmx'
$resultados = Join-Path $PSScriptRoot 'resultados'

if (-not (Test-Path $stats)) { throw "No existe $stats. Ejecuta: cd front ; npx ng build --stats-json" }

# ---------------------------------------------------------------------
# 1. Recursos que descarga el navegador en cada vista
# ---------------------------------------------------------------------
$html = Get-Content (Join-Path $navegador 'index.html') -Raw
$iniciales = [regex]::Matches($html, '(?:src|href)="([^"]+\.(?:js|css))"') | ForEach-Object { '/' + $_.Groups[1].Value } |
    Select-Object -Unique
$iniciales += '/favicon.ico'

$salidas = (Get-Content $stats -Raw | ConvertFrom-Json).outputs.PSObject.Properties
function Chunk-De([string]$entrada) {
    ($salidas | Where-Object { $_.Value.entryPoint -eq $entrada }).Name
}
function Dependencias([string]$chunk) {
    $o = ($salidas | Where-Object Name -eq $chunk).Value
    $deps = @($chunk)
    foreach ($i in $o.imports | Where-Object kind -eq 'import-statement') { $deps += Dependencias $i.path }
    return $deps
}

# Los modulos ES ya cargados no se vuelven a pedir: cada vista solo descarga los chunks nuevos.
$cargados = New-Object System.Collections.Generic.HashSet[string]
foreach ($r in $iniciales) { [void]$cargados.Add($r) }
function Nuevos([string[]]$entradas) {
    $lista = @()
    foreach ($e in $entradas) {
        foreach ($d in Dependencias (Chunk-De $e)) {
            if ($cargados.Add("/$d")) { $lista += "/$d" }
        }
    }
    return $lista
}

$vistas = [ordered]@{
    '01 Abrir login (/login)'        = @{ Html = '/login';    Recursos = $iniciales + (Nuevos @('src/app/features/auth/login/login.ts')) }
    '02 Ingresar al Dashboard'       = @{ Html = $null;       Recursos = Nuevos @('src/app/layout/main-layout/main-layout.ts', 'src/app/features/dashboard/dashboard.ts') }
    '03 Abrir Nueva venta'           = @{ Html = $null;       Recursos = Nuevos @('src/app/features/ventas/nueva-venta/nueva-venta.ts') }
    '04 Abrir Productos'             = @{ Html = $null;       Recursos = Nuevos @('src/app/features/productos/producto-list/producto-list.ts') }
    '05 Abrir Reportes'              = @{ Html = $null;       Recursos = Nuevos @('src/app/features/reportes/reporte-ventas/reporte-ventas.ts') }
    '06 Recargar /reportes (F5)'     = @{ Html = '/reportes'; Recursos = $iniciales }
}

# ---------------------------------------------------------------------
# 2. Generacion del plan .jmx
# ---------------------------------------------------------------------
function Esc([string]$t) { [Security.SecurityElement]::Escape($t) }

function Sampler([string]$ruta, [bool]$esHtml) {
    $asercion = ''
    if ($esHtml) {
        $asercion = @"
              <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Contiene app-root (SPA fallback)">
                <collectionProp name="Asserion.test_strings"><stringProp name="1">&lt;app-root</stringProp></collectionProp>
                <stringProp name="Assertion.custom_message">El servidor no devolvio el index.html de la SPA</stringProp>
                <stringProp name="Assertion.test_field">Assertion.response_data</stringProp>
                <boolProp name="Assertion.assume_success">false</boolProp>
                <intProp name="Assertion.test_type">16</intProp>
              </ResponseAssertion>
              <hashTree/>
"@
    }
    return @"
            <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="GET $(Esc $ruta)">
              <stringProp name="HTTPSampler.path">$(Esc $ruta)</stringProp>
              <stringProp name="HTTPSampler.method">GET</stringProp>
              <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
              <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
              <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments">
                <collectionProp name="Arguments.arguments"/>
              </elementProp>
            </HTTPSamplerProxy>
            <hashTree>
$asercion
            </hashTree>
"@
}

$cuerpo = ''
$primera = $true
foreach ($nombre in $vistas.Keys) {
    $v = $vistas[$nombre]
    if (-not $primera) {
        $cuerpo += @"
          <TestAction guiclass="TestActionGui" testclass="TestAction" testname="Tiempo de lectura del usuario">
            <intProp name="ActionProcessor.action">1</intProp>
            <intProp name="ActionProcessor.target">0</intProp>
            <stringProp name="ActionProcessor.duration">0</stringProp>
          </TestAction>
          <hashTree>
            <UniformRandomTimer guiclass="UniformRandomTimerGui" testclass="UniformRandomTimer" testname="Pensar 1 a 3 s">
              <stringProp name="ConstantTimer.delay">`${__P(pausa,1000)}</stringProp>
              <stringProp name="RandomTimer.range">`${__P(pausa_rango,2000)}</stringProp>
            </UniformRandomTimer>
            <hashTree/>
          </hashTree>
"@
    }
    $primera = $false
    $samplers = ''
    if ($v.Html) { $samplers += Sampler $v.Html $true }
    foreach ($r in $v.Recursos) { $samplers += Sampler $r $false }
    $cuerpo += @"
          <TransactionController guiclass="TransactionControllerGui" testclass="TransactionController" testname="$(Esc $nombre)">
            <boolProp name="TransactionController.includeTimers">false</boolProp>
            <boolProp name="TransactionController.parent">false</boolProp>
          </TransactionController>
          <hashTree>
$samplers
          </hashTree>
"@
}

$jmx = @"
<?xml version="1.0" encoding="UTF-8"?>
<!-- Generado por ejecutar-jmeter.ps1 a partir del build de produccion de CoffeeFlow -->
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.6.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="CoffeeFlow - Carga y estres">
      <stringProp name="TestPlan.comments">Usuarios: -Jusuarios, rampa: -Jrampa (s), duracion: -Jduracion (s), host/puerto: -Jhost -Jpuerto</stringProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="Variables">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
    </TestPlan>
    <hashTree>
      <ConfigTestElement guiclass="HttpDefaultsGui" testclass="ConfigTestElement" testname="Valores por defecto HTTP">
        <stringProp name="HTTPSampler.domain">`${__P(host,$Servidor)}</stringProp>
        <stringProp name="HTTPSampler.port">`${__P(puerto,$Puerto)}</stringProp>
        <stringProp name="HTTPSampler.protocol">http</stringProp>
        <stringProp name="HTTPSampler.implementation">HttpClient4</stringProp>
        <stringProp name="HTTPSampler.connect_timeout">5000</stringProp>
        <stringProp name="HTTPSampler.response_timeout">15000</stringProp>
        <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments">
          <collectionProp name="Arguments.arguments"/>
        </elementProp>
      </ConfigTestElement>
      <hashTree/>
      <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="Cabeceras de navegador">
        <collectionProp name="HeaderManager.headers">
          <elementProp name="" elementType="Header">
            <stringProp name="Header.name">User-Agent</stringProp>
            <stringProp name="Header.value">Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/155.0 JMeter/5.6.3</stringProp>
          </elementProp>
          <elementProp name="" elementType="Header">
            <stringProp name="Header.name">Accept-Language</stringProp>
            <stringProp name="Header.value">es-CL,es;q=0.9</stringProp>
          </elementProp>
          <elementProp name="" elementType="Header">
            <stringProp name="Header.name">Accept-Encoding</stringProp>
            <stringProp name="Header.value">gzip, deflate</stringProp>
          </elementProp>
        </collectionProp>
      </HeaderManager>
      <hashTree/>
      <CacheManager guiclass="CacheManagerGui" testclass="CacheManager" testname="Cache del navegador (nuevo usuario por iteracion)">
        <boolProp name="clearEachIteration">true</boolProp>
        <boolProp name="useExpires">true</boolProp>
        <intProp name="maxSize">5000</intProp>
      </CacheManager>
      <hashTree/>
      <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Codigo HTTP 200 o 304">
        <collectionProp name="Asserion.test_strings">
          <stringProp name="49586">200</stringProp>
          <stringProp name="50551">304</stringProp>
        </collectionProp>
        <stringProp name="Assertion.custom_message">Codigo HTTP inesperado</stringProp>
        <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
        <boolProp name="Assertion.assume_success">false</boolProp>
        <intProp name="Assertion.test_type">40</intProp>
      </ResponseAssertion>
      <hashTree/>
      <DurationAssertion guiclass="DurationAssertionGui" testclass="DurationAssertion" testname="RNF-02 cada recurso responde en menos de 2 s">
        <stringProp name="DurationAssertion.duration">2000</stringProp>
      </DurationAssertion>
      <hashTree/>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Usuarios de CoffeeFlow">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController">
          <stringProp name="LoopController.loops">-1</stringProp>
          <boolProp name="LoopController.continue_forever">false</boolProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">`${__P(usuarios,50)}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">`${__P(rampa,30)}</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">`${__P(duracion,120)}</stringProp>
        <stringProp name="ThreadGroup.delay">0</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">false</boolProp>
      </ThreadGroup>
      <hashTree>
$cuerpo
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
"@
[IO.File]::WriteAllText($plan, $jmx, (New-Object Text.UTF8Encoding($false)))
Write-Host "Plan generado: $plan"
if ($SoloGenerar) { return }

# ---------------------------------------------------------------------
# 3. Ejecucion de escenarios (modo no grafico)
# ---------------------------------------------------------------------
try { Invoke-WebRequest -UseBasicParsing "http://${Servidor}:$Puerto/login" -TimeoutSec 5 | Out-Null }
catch { throw "CoffeeFlow no responde en http://${Servidor}:$Puerto. Levanta el sitio estatico (ver encabezado)." }

$escenarios = @(
    @{ Nombre = 'carga-50u';    Usuarios = 50;   Rampa = 30; Duracion = 120 },
    @{ Nombre = 'estres-100u';  Usuarios = 100;  Rampa = 20; Duracion = 60 },
    @{ Nombre = 'estres-250u';  Usuarios = 250;  Rampa = 20; Duracion = 60 },
    @{ Nombre = 'estres-500u';  Usuarios = 500;  Rampa = 20; Duracion = 60 },
    @{ Nombre = 'estres-1000u'; Usuarios = 1000; Rampa = 20; Duracion = 60 },
    # Peor caso: sin tiempo de lectura, cada usuario encadena vistas sin pausa (busca el punto de quiebre)
    @{ Nombre = 'estres-sin-espera-1000u'; Usuarios = 1000; Rampa = 10; Duracion = 60; Pausa = 0; Rango = 0 }
)
$env:HEAP = '-Xms1g -Xmx2g'
foreach ($e in $escenarios | Where-Object { -not $Solo -or $_.Nombre -in $Solo }) {
    $dir = Join-Path $resultados $e.Nombre
    if (Test-Path $dir) { Remove-Item $dir -Recurse -Force }
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    Write-Host "`n==> $($e.Nombre): $($e.Usuarios) usuarios, rampa $($e.Rampa) s, $($e.Duracion) s" -ForegroundColor Cyan
    & $jmeter -n -t $plan -l (Join-Path $dir 'resultados.jtl') -e -o (Join-Path $dir 'reporte') `
        "-Jusuarios=$($e.Usuarios)" "-Jrampa=$($e.Rampa)" "-Jduracion=$($e.Duracion)" `
        "-Jhost=$Servidor" "-Jpuerto=$Puerto" "-Jpausa=$(if ($null -ne $e.Pausa) { $e.Pausa } else { 1000 })" "-Jpausa_rango=$(if ($null -ne $e.Rango) { $e.Rango } else { 2000 })" -j (Join-Path $dir 'jmeter.log')
    if ($LASTEXITCODE -ne 0) { throw "JMeter termino con codigo $LASTEXITCODE en $($e.Nombre)" }
}

# ---------------------------------------------------------------------
# 4. Resumen (a partir de statistics.json de cada reporte)
# ---------------------------------------------------------------------
$filas = foreach ($e in $escenarios | Where-Object { Test-Path (Join-Path $resultados "$($_.Nombre)\reporte\statistics.json") }) {
    $st = Get-Content (Join-Path $resultados "$($e.Nombre)\reporte\statistics.json") -Raw | ConvertFrom-Json
    foreach ($p in $st.PSObject.Properties) {
        $s = $p.Value
        [pscustomobject]@{
            Escenario = $e.Nombre; Usuarios = $e.Usuarios; Transaccion = $s.transaction
            Muestras = $s.sampleCount; Errores = $s.errorCount; PctError = [math]::Round($s.errorPct, 2)
            Promedio_ms = [math]::Round($s.meanResTime, 1); Mediana_ms = [math]::Round($s.medianResTime, 1)
            P90_ms = [math]::Round($s.pct1ResTime, 1); P95_ms = [math]::Round($s.pct2ResTime, 1)
            P99_ms = [math]::Round($s.pct3ResTime, 1); Max_ms = $s.maxResTime
            Throughput_s = [math]::Round($s.throughput, 2); KB_s = [math]::Round($s.receivedKBytesPerSec, 1)
        }
    }
}
$filas | Export-Csv (Join-Path $resultados 'resumen.csv') -NoTypeInformation -Encoding UTF8
$filas | Where-Object { $_.Transaccion -eq 'Total' -or $_.Transaccion -like '0*' } |
    Format-Table Escenario, Transaccion, Muestras, PctError, Promedio_ms, P95_ms, Max_ms, Throughput_s -AutoSize
Write-Host "Resumen: $(Join-Path $resultados 'resumen.csv')" -ForegroundColor Green
