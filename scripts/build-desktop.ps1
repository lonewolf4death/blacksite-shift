param(
  [ValidateSet('BLACKSITE SHIFT-win32-x64', 'BLACKSITE SHIFT-dev-win32-x64')]
  [string]$OutputName = 'BLACKSITE SHIFT-win32-x64'
)
$ErrorActionPreference = 'Stop'

$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$version = '45.1.0'
$archiveName = "electron-v$version-win32-x64.zip"
$releaseBase = "https://github.com/electron/electron/releases/download/v$version"
$cacheDir = Join-Path $projectRoot '.build-cache'
$distDir = Join-Path $projectRoot 'dist'
$targetDir = Join-Path $distDir $OutputName
$archivePath = Join-Path $cacheDir $archiveName
$checksumPath = Join-Path $cacheDir 'SHASUMS256.txt'

New-Item -ItemType Directory -Force -Path $cacheDir, $distDir | Out-Null
if (!(Test-Path -LiteralPath $archivePath)) {
  Invoke-WebRequest -Uri "$releaseBase/$archiveName" -OutFile $archivePath -UseBasicParsing
}
if (!(Test-Path -LiteralPath $checksumPath)) {
  Invoke-WebRequest -Uri "$releaseBase/SHASUMS256.txt" -OutFile $checksumPath -UseBasicParsing
}
$checksumLine = Get-Content -LiteralPath $checksumPath | Where-Object { $_.EndsWith($archiveName) } | Select-Object -First 1
if (!$checksumLine) { throw "Official checksum missing for $archiveName" }
$expected = ($checksumLine -split '\s+')[0].ToUpperInvariant()
$actual = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash
if ($actual -ne $expected) { throw "Electron archive checksum mismatch: $actual" }

if (Test-Path -LiteralPath $targetDir) {
  $resolved = [IO.Path]::GetFullPath($targetDir)
  $safeRoot = [IO.Path]::GetFullPath($distDir).TrimEnd('\') + '\'
  if (!$resolved.StartsWith($safeRoot, [StringComparison]::OrdinalIgnoreCase) -or
      [IO.Path]::GetFileName($resolved) -ne $OutputName) {
    throw "Refusing to remove unexpected build path: $resolved"
  }
  $existingExe = Join-Path $resolved 'BLACKSITE SHIFT.exe'
  if (Test-Path -LiteralPath $existingExe) {
    try {
      $lockCheck = [IO.File]::Open($existingExe, [IO.FileMode]::Open, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
      $lockCheck.Dispose()
    } catch {
      throw "Build target is running. Close it or use -OutputName 'BLACKSITE SHIFT-dev-win32-x64'."
    }
  }
  Remove-Item -LiteralPath $resolved -Recurse -Force
}

Expand-Archive -LiteralPath $archivePath -DestinationPath $targetDir
$appDir = Join-Path $targetDir 'resources\app'
New-Item -ItemType Directory -Force -Path $appDir | Out-Null
Copy-Item -LiteralPath (Join-Path $projectRoot 'package.json'),(Join-Path $projectRoot 'desktop.js'),(Join-Path $projectRoot 'server.js') -Destination $appDir
Copy-Item -LiteralPath (Join-Path $projectRoot 'public') -Destination $appDir -Recurse
Rename-Item -LiteralPath (Join-Path $targetDir 'electron.exe') -NewName 'BLACKSITE SHIFT.exe'
$reporter = Join-Path $targetDir 'electron_wer.dll'
if (Test-Path -LiteralPath $reporter) { Rename-Item -LiteralPath $reporter -NewName 'BLACKSITE SHIFT_wer.dll' }

$exe = Join-Path $targetDir 'BLACKSITE SHIFT.exe'
Write-Host "Built $exe"
