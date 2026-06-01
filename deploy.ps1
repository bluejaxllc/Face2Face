$token = "nfp_chTiD2k5eVWrBPZD158ov5maYRbxgLcSbfb2"
$headers = @{
    "Authorization" = "Bearer $token"
}

# Get site ID
$sites = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites?name=f2f-command-center" -Headers $headers -Method Get
$siteId = $sites[0].id
Write-Host "Site ID: $siteId"

# Read HTML file and create a zip with index.html + _headers
$tempDir = Join-Path $env:TEMP "netlify_deploy"
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Source from dashboard-deploy directory
$srcDir = "C:\Users\edgar\OneDrive\Desktop\Face 2 Face\dashboard-deploy"
Copy-Item "$srcDir\index.html" "$tempDir\index.html"
if (Test-Path "$srcDir\_headers") {
    Copy-Item "$srcDir\_headers" "$tempDir\_headers"
}

$zipPath = Join-Path $env:TEMP "netlify_deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }

# Build file list for tar
$filesToZip = @("index.html")
if (Test-Path "$tempDir\_headers") { $filesToZip += "_headers" }
tar.exe -a -cf $zipPath -C $tempDir @filesToZip

# Deploy via API
$deployHeaders = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/zip"
}
$zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
$result = Invoke-RestMethod -Uri "https://api.netlify.com/api/v1/sites/$siteId/deploys" -Headers $deployHeaders -Method Post -Body $zipBytes
Write-Host "Deploy ID: $($result.id)"
Write-Host "State: $($result.state)"
Write-Host "URL: $($result.ssl_url)"

# Cleanup
Remove-Item -Recurse -Force $tempDir
Remove-Item $zipPath
