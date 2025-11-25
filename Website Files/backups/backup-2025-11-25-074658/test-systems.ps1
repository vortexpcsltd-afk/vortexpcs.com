# System Diagnostics
Write-Host "Testing systems..." -ForegroundColor Cyan

$baseUrl = "https://www.vortexpcs.com"
$passed = 0
$failed = 0

# Test Contact Form
Write-Host "Testing Contact Form..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/contact/send" -Method OPTIONS -ErrorAction Stop | Out-Null
    Write-Host "  PASS - Contact form endpoint accessible" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  FAIL - Contact form endpoint error" -ForegroundColor Red
    $failed++
}

# Test Analytics
Write-Host "Testing Analytics..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/admin/analytics/live" -Method GET -ErrorAction Stop | Out-Null
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
        Write-Host "  PASS - Analytics requires authentication" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL - Unexpected error" -ForegroundColor Red
        $failed++
    }
}

# Test Monitoring
Write-Host "Testing Monitoring..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/admin/monitoring/health" -Method GET -ErrorAction Stop | Out-Null
} catch {
    if ($_.Exception.Response.StatusCode.Value__ -eq 401) {
        Write-Host "  PASS - Monitoring requires authentication" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  FAIL - Unexpected error" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Results: $passed passed, $failed failed" -ForegroundColor Cyan
Write-Host "Next: Login at https://www.vortexpcs.com/admin" -ForegroundColor Cyan
