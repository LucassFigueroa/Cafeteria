# =====================================================================
#  CoffeeFlow - Instalacion de SonarQube Community Build y escaneo
#  Uso (PowerShell, dentro de la carpeta Cafeteria):
#     powershell -ExecutionPolicy Bypass -File .\ejecutar-sonarqube.ps1
#  Requisitos: conexion a internet y Node.js (ya instalado para Angular).
#  Deja SonarQube corriendo en http://localhost:9000
# =====================================================================

$ErrorActionPreference = 'Stop'
$ProgressPreference    = 'SilentlyContinue'

$SONAR_VERSION = '26.9.0.129388'
$PROYECTO      = 'coffeeflow'
$ADMIN_PASS    = 'CoffeeFlow#2026'
$SONAR_URL     = 'http://localhost:9000'

$raiz       = $PSScriptRoot
$herramient = Join-Path $raiz 'herramientas'
$resultados = Join-Path $raiz 'resultados-sonar'
New-Item -ItemType Directory -Force -Path $herramient, $resultados | Out-Null

function Paso($texto) { Write-Host "`n==> $texto" -ForegroundColor Cyan }

function Encabezado($usuario, $clave) {
    $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${usuario}:${clave}"))
    return @{ Authorization = "Basic $b64" }
}

# ---------------------------------------------------------------------
Paso '1/7 Verificando Java 21 (requerido por SonarQube)'
$javaExe = $null
$jdkLocal = Get-ChildItem -Path $herramient -Directory -Filter 'jdk-21*' -ErrorAction SilentlyContinue | Select-Object -First 1
if ($jdkLocal) {
    $javaExe = Join-Path $jdkLocal.FullName 'bin\java.exe'
} else {
    try {
        $ver = (& java -version 2>&1 | Select-Object -First 1).ToString()
        if ($ver -match '"(\d+)') { if ([int]$Matches[1] -ge 21) { $javaExe = (Get-Command java).Source } }
    } catch { }
}
if (-not $javaExe) {
    Write-Host 'Descargando JDK 21 portable (Eclipse Temurin)...'
    $zipJdk = Join-Path $herramient 'jdk21.zip'
    Invoke-WebRequest -Uri 'https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk' -OutFile $zipJdk
    Expand-Archive -Path $zipJdk -DestinationPath $herramient -Force
    Remove-Item $zipJdk
    $jdkLocal = Get-ChildItem -Path $herramient -Directory -Filter 'jdk-21*' | Select-Object -First 1
    $javaExe  = Join-Path $jdkLocal.FullName 'bin\java.exe'
}
Write-Host "Java: $javaExe"
$env:SONAR_JAVA_PATH = $javaExe

# ---------------------------------------------------------------------
Paso "2/7 Instalando SonarQube Community Build $SONAR_VERSION"
$sonarDir = Join-Path $herramient "sonarqube-$SONAR_VERSION"
if (-not (Test-Path $sonarDir)) {
    $zipSonar = Join-Path $herramient 'sonarqube.zip'
    Write-Host 'Descargando SonarQube (aprox. 900 MB, puede tardar varios minutos)...'
    Invoke-WebRequest -Uri "https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-$SONAR_VERSION.zip" -OutFile $zipSonar
    Write-Host 'Descomprimiendo...'
    Expand-Archive -Path $zipSonar -DestinationPath $herramient -Force
    Remove-Item $zipSonar
}

# ---------------------------------------------------------------------
Paso '3/7 Iniciando el servidor SonarQube'
$arriba = $false
try { $arriba = ((Invoke-RestMethod "$SONAR_URL/api/system/status").status -eq 'UP') } catch { }
if (-not $arriba) {
    $bat = Join-Path $sonarDir 'bin\windows-x86-64\StartSonar.bat'
    Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "`"$bat`"" -WorkingDirectory (Split-Path $bat)
    Write-Host 'Esperando que SonarQube quede en estado UP (1-3 minutos)...'
    for ($i = 0; $i -lt 90; $i++) {
        Start-Sleep -Seconds 5
        try { if ((Invoke-RestMethod "$SONAR_URL/api/system/status").status -eq 'UP') { $arriba = $true; break } } catch { }
    }
    if (-not $arriba) { throw 'SonarQube no inicio. Revisa la ventana de SonarQube y la carpeta logs.' }
}
Write-Host 'SonarQube esta UP.' -ForegroundColor Green

# ---------------------------------------------------------------------
Paso '4/7 Configurando usuario, proyecto y token'
$auth = Encabezado 'admin' $ADMIN_PASS
try {
    Invoke-RestMethod -Method Post -Uri "$SONAR_URL/api/users/change_password" -Headers (Encabezado 'admin' 'admin') `
        -Body @{ login = 'admin'; previousPassword = 'admin'; password = $ADMIN_PASS } | Out-Null
    Write-Host "Contrasena de admin cambiada a: $ADMIN_PASS"
} catch { Write-Host 'La contrasena de admin ya estaba configurada.' }

try {
    Invoke-RestMethod -Method Post -Uri "$SONAR_URL/api/projects/create" -Headers $auth `
        -Body @{ project = $PROYECTO; name = 'CoffeeFlow' } | Out-Null
} catch { Write-Host 'El proyecto ya existia.' }

$nombreToken = "scanner-$(Get-Date -Format 'yyyyMMddHHmmss')"
$token = (Invoke-RestMethod -Method Post -Uri "$SONAR_URL/api/user_tokens/generate" -Headers $auth `
    -Body @{ name = $nombreToken; type = 'PROJECT_ANALYSIS_TOKEN'; projectKey = $PROYECTO }).token

# ---------------------------------------------------------------------
Paso '5/7 Ejecutando SonarScanner sobre CoffeeFlow'
$lcov = Join-Path $raiz 'front\coverage\front\lcov.info'
if (Test-Path $lcov) {
    # El lcov de "ng test" es relativo a front\; SonarQube resuelve las rutas desde la raiz.
    (Get-Content $lcov) -replace '^SF:(?!front)', 'SF:front/' -replace '\\', '/' |
        Set-Content -Encoding ascii (Join-Path $raiz 'front\coverage\front\lcov-sonar.info')
} else {
    Write-Host 'Sin cobertura: ejecuta "cd front ; npx ng test --watch=false --coverage" antes del analisis.'
}
Push-Location $raiz
try {
    & npx --yes '@sonar/scan' "-Dsonar.host.url=$SONAR_URL" "-Dsonar.token=$token"
    if ($LASTEXITCODE -ne 0) { throw "SonarScanner termino con codigo $LASTEXITCODE" }
} finally { Pop-Location }

# ---------------------------------------------------------------------
Paso '6/7 Esperando el procesamiento del analisis'
for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 3
    $ce = Invoke-RestMethod -Uri "$SONAR_URL/api/ce/component?component=$PROYECTO" -Headers $auth
    if ($ce.queue.Count -eq 0 -and $ce.current) { break }
}
Write-Host "Estado del analisis: $($ce.current.status)"

# ---------------------------------------------------------------------
Paso '7/7 Exportando resultados a resultados-sonar\'
$metricas = 'bugs,vulnerabilities,code_smells,security_hotspots,coverage,ncloc,duplicated_lines_density,' +
            'reliability_rating,security_rating,sqale_rating,sqale_index,alert_status,' +
            'software_quality_reliability_issues,software_quality_security_issues,software_quality_maintainability_issues'
Invoke-RestMethod -Uri "$SONAR_URL/api/measures/component?component=$PROYECTO&metricKeys=$metricas" -Headers $auth |
    ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 (Join-Path $resultados 'medidas.json')
Invoke-RestMethod -Uri "$SONAR_URL/api/issues/search?componentKeys=$PROYECTO&ps=500&issueStatuses=OPEN,CONFIRMED" -Headers $auth |
    ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 (Join-Path $resultados 'issues.json')
Invoke-RestMethod -Uri "$SONAR_URL/api/hotspots/search?project=$PROYECTO&ps=500" -Headers $auth |
    ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 (Join-Path $resultados 'hotspots.json')
Invoke-RestMethod -Uri "$SONAR_URL/api/qualitygates/project_status?projectKey=$PROYECTO" -Headers $auth |
    ConvertTo-Json -Depth 10 | Out-File -Encoding utf8 (Join-Path $resultados 'quality-gate.json')

$m = (Get-Content (Join-Path $resultados 'medidas.json') -Raw | ConvertFrom-Json).component.measures
Write-Host "`nRESUMEN" -ForegroundColor Green
$m | Where-Object { $_.metric -in 'bugs','vulnerabilities','code_smells','coverage','security_hotspots','ncloc' } |
    ForEach-Object { '{0,-20} {1}' -f $_.metric, $_.value }
Write-Host "`nListo. Abre $SONAR_URL/dashboard?id=$PROYECTO  (usuario: admin / clave: $ADMIN_PASS)" -ForegroundColor Green
Write-Host 'Toma capturas del Overview y de la pestana Issues para el informe.'
Start-Process "$SONAR_URL/dashboard?id=$PROYECTO"
