# =====================================================================
#  CoffeeFlow - Analisis de vulnerabilidades con OWASP ZAP 2.17 (modo comando)
#  Uso (PowerShell, dentro de la carpeta Cafeteria):
#     powershell -ExecutionPolicy Bypass -File .\pruebas-seguridad\ejecutar-zap.ps1
#  Requisito previo: sitio estatico levantado en http://localhost:8080
#     cd front ; npx ng build ; npx serve@14 -s dist/front/browser -l 8080
#  Ademas ejecuta "npm audit" (analisis de dependencias, OWASP A06) sobre el front.
#  Deja los reportes en pruebas-seguridad\zap\ y pruebas-seguridad\npm-audit.json
# =====================================================================

$ErrorActionPreference = 'Stop'
$raiz    = Split-Path $PSScriptRoot -Parent
$zapDir  = Join-Path $raiz 'herramientas\ZAP_2.17.0'
$zapHome = Join-Path $raiz 'herramientas\zap-home'
$plan    = Join-Path $PSScriptRoot 'zap-coffeeflow.yaml'

try { Invoke-WebRequest -UseBasicParsing 'http://localhost:8080/login' -TimeoutSec 5 | Out-Null }
catch { throw 'CoffeeFlow no responde en http://localhost:8080. Levanta el sitio estatico (ver encabezado).' }

New-Item -ItemType Directory -Force -Path $zapHome, (Join-Path $PSScriptRoot 'zap') | Out-Null
$jar = Get-ChildItem $zapDir -Filter 'zap-*.jar' | Select-Object -First 1

Write-Host '==> OWASP ZAP: spider + AJAX spider + escaneo pasivo y activo' -ForegroundColor Cyan
Push-Location $PSScriptRoot
try {
    # -port 8090: el proxy de ZAP usa 8080 por defecto, el mismo puerto del sitio; si coinciden ZAP termina
    # escaneando su propia API (/UI/...) en lugar de CoffeeFlow.
    & java -Xmx2g -jar $jar.FullName -cmd -dir $zapHome -port 8090 -addonupdate -autorun $plan
    $codigo = $LASTEXITCODE
} finally { Pop-Location }
Write-Host "ZAP finalizo con codigo $codigo (0 = sin errores del plan; 2 = hay alertas de advertencia)"

Write-Host '==> npm audit (dependencias con vulnerabilidades conocidas)' -ForegroundColor Cyan
Push-Location (Join-Path $raiz 'front')
try {
    npm audit --json | Out-File -Encoding utf8 (Join-Path $PSScriptRoot 'npm-audit.json')
    npm audit
} finally { Pop-Location }
