<#
  Setup Vercel environment variables for this project (Windows PowerShell 5.1+).

  What it does:
  - Ensures Vercel CLI is installed and the directory is linked to a Vercel project
  - Prompts for FIREBASE_PROJECT_ID
  - Accepts either a path to your Firebase Admin JSON or a pasted base64 string
  - Adds FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_BASE64 to Vercel envs for Production and Preview

  Usage:
    pwsh -File scripts/setup-vercel-env.ps1
    # or
    powershell -ExecutionPolicy Bypass -File scripts/setup-vercel-env.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-VercelCli {
  $vercel = Get-Command vercel -ErrorAction SilentlyContinue
  if (-not $vercel) {
    Write-Host "Vercel CLI not found. Installing globally via npm..." -ForegroundColor Yellow
    npm i -g vercel | Out-Host
  } else {
    Write-Host "Vercel CLI is installed: $($vercel.Source)" -ForegroundColor Green
  }
}

function Ensure-VercelLink {
  $vercelDir = Join-Path -LiteralPath (Get-Location) '.vercel'
  $projJson = Join-Path -LiteralPath $vercelDir 'project.json'
  if (Test-Path $projJson) {
    Write-Host "Project already linked via .vercel/project.json" -ForegroundColor Green
  } else {
    Write-Host "This folder is not linked to a Vercel project. Running 'vercel link'..." -ForegroundColor Yellow
    vercel link | Out-Host
  }
}

function Add-VercelEnv([string]$name, [string]$value, [string]$environment) {
  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "Missing value for $name"
  }
  $tmp = [System.IO.Path]::GetTempFileName()
  [System.IO.File]::WriteAllText($tmp, $value)
  try {
    Get-Content -Raw $tmp | vercel env add $name $environment | Out-Host
  } finally {
    Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue
  }
}

Write-Host "--- Vercel Env Setup ---" -ForegroundColor Cyan
Ensure-VercelCli
Ensure-VercelLink

$projectId = Read-Host -Prompt "Enter FIREBASE_PROJECT_ID (e.g., vortexpcs-prod)"
if ([string]::IsNullOrWhiteSpace($projectId)) {
  throw "FIREBASE_PROJECT_ID is required"
}

Write-Host "Provide your Firebase Admin credentials:" -ForegroundColor Cyan
Write-Host "Option A) Enter full path to service account JSON (e.g., C:\\Secrets\\firebase-admin-key.json)" -ForegroundColor DarkGray
Write-Host "Option B) Leave blank to paste FIREBASE_SERVICE_ACCOUNT_BASE64 directly in the next step" -ForegroundColor DarkGray
$jsonPath = Read-Host -Prompt "Path to service account JSON (or leave blank)"

$serviceB64 = ""
if (-not [string]::IsNullOrWhiteSpace($jsonPath)) {
  if (-not (Test-Path -LiteralPath $jsonPath)) {
    throw "File not found: $jsonPath"
  }
  $bytes = [System.IO.File]::ReadAllBytes($jsonPath)
  $serviceB64 = [Convert]::ToBase64String($bytes)
} else {
  $serviceB64 = Read-Host -Prompt "Paste FIREBASE_SERVICE_ACCOUNT_BASE64"
}

Write-Host "Adding envs to Vercel (Production + Preview)..." -ForegroundColor Cyan
foreach ($env in @('production','preview')) {
  Write-Host "Adding FIREBASE_PROJECT_ID -> $env" -ForegroundColor Yellow
  Add-VercelEnv -name 'FIREBASE_PROJECT_ID' -value $projectId -environment $env
  Write-Host "Adding FIREBASE_SERVICE_ACCOUNT_BASE64 -> $env" -ForegroundColor Yellow
  Add-VercelEnv -name 'FIREBASE_SERVICE_ACCOUNT_BASE64' -value $serviceB64 -environment $env
}

Write-Host "Done. You can now deploy: vercel deploy --prod" -ForegroundColor Green