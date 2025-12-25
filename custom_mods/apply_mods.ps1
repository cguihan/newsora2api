param(
    [string]$RepoRoot = (Get-Location).Path
)

$overrideRoot = Join-Path $RepoRoot 'custom_mods\overrides'
if (-not (Test-Path $overrideRoot)) {
    Write-Error "Overrides not found: $overrideRoot"
    exit 1
}

Get-ChildItem -Path $overrideRoot -Recurse -File | ForEach-Object {
    $relative = $_.FullName.Substring($overrideRoot.Length).TrimStart('\\')
    $dest = Join-Path $RepoRoot $relative
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $dest -Force
}

Write-Host 'Applied overrides from custom_mods/overrides.'
