[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]{20}$')]
    [string]$ProjectRef
)

$ErrorActionPreference = 'Stop'
$sljRepository = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    throw 'Supabase CLI belum tersedia.'
}
if (-not $PSCmdlet.ShouldProcess($ProjectRef, 'Deploy Edge Function send-user-reminders')) { return }

Push-Location -LiteralPath $sljRepository
try {
    & supabase functions deploy send-user-reminders --project-ref $ProjectRef --no-verify-jwt --use-api
    if ($LASTEXITCODE -ne 0) {
        throw 'Deployment belum berhasil. Jalankan supabase login melalui browser, pastikan project SLJ benar, lalu ulangi. Jangan mengirim token di chat.'
    }
    Write-Host 'Worker berhasil dideploy. Jadwal cron dan secret yang ada tetap digunakan.'
}
finally {
    Pop-Location
}
