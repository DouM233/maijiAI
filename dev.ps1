$nodeRoot = Join-Path $PSScriptRoot ".tools\node-v22.22.2-win-x64"
$env:Path = "$nodeRoot;$env:Path"
& "$nodeRoot\npm.cmd" run dev
