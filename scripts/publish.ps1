# Interactive publish helper: run this in a real terminal so the registry can
# prompt for an OTP. (Non-interactive shells fail with ERR_PNPM_OTP_NON_INTERACTIVE.)
$ErrorActionPreference = "Stop"
$node = Join-Path $env:USERPROFILE ".dsh\dsh-runtimes\dsh-primary-runtime\dependencies\node\bin\node.exe"
$pnpm = Join-Path $env:USERPROFILE ".dsh\dsh-runtimes\dsh-primary-runtime\dependencies\pnpm\bin\pnpm.mjs"
if (-not (Test-Path $node)) { throw "node not found: $node" }
if (-not (Test-Path $pnpm)) { throw "pnpm not found: $pnpm" }
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
  & $node $pnpm publish --access public --no-git-checks --registry https://registry.npmjs.org
} finally {
  Pop-Location
}
