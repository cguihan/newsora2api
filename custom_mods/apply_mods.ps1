param(
    [string]$RepoRoot = (Get-Location).Path
)

$overrideRoot = Join-Path $RepoRoot 'custom_mods\overrides'
if (-not (Test-Path $overrideRoot)) {
    Write-Error "Overrides not found: $overrideRoot"
    exit 1
}

$excludeDirPattern = '(^|\\)(?:__pycache__|\.pytest_cache|\.mypy_cache|\.ruff_cache|node_modules|dist|build)(\\|$)'
$excludeExtensions = @('.pyc', '.pyo', '.pyd', '.log', '.db', '.sqlite', '.sqlite3')
$excludeFileNames = @('.DS_Store', 'Thumbs.db')

Get-ChildItem -Path $overrideRoot -Recurse -File | Where-Object {
    $relative = $_.FullName.Substring($overrideRoot.Length).TrimStart('\\')
    if ($relative -match $excludeDirPattern) { return $false }
    if ($excludeExtensions -contains $_.Extension) { return $false }
    if ($excludeFileNames -contains $_.Name) { return $false }
    return $true
} | ForEach-Object {
    $relative = $_.FullName.Substring($overrideRoot.Length).TrimStart('\\')
    $dest = Join-Path $RepoRoot $relative
    $destDir = Split-Path $dest -Parent
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    }
    Copy-Item -Path $_.FullName -Destination $dest -Force
}

Write-Host 'Applied overrides from custom_mods/overrides.'
