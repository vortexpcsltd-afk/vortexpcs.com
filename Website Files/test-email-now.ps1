# Quick Email Test Script
# Tests if SMTP credentials are working

Write-Host "🔍 Testing Email Configuration..." -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path .env.production.local) {
    Get-Content .env.production.local | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim('"')
            $value = $matches[2].Trim('"')
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✅ Loaded environment variables" -ForegroundColor Green
} else {
    Write-Host "❌ .env.production.local not found" -ForegroundColor Red
    Write-Host "Run: vercel env pull .env.production.local --environment=production" -ForegroundColor Yellow
    exit 1
}

# Check required variables
$required = @('SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_PORT', 'BUSINESS_EMAIL')
$missing = @()

Write-Host ""
Write-Host "📋 Configuration Check:" -ForegroundColor Cyan
foreach ($var in $required) {
    $value = [Environment]::GetEnvironmentVariable($var, "Process")
    if ($value) {
        if ($var -like '*PASS*') {
            Write-Host "  ✅ $var = ***REDACTED***" -ForegroundColor Green
        } else {
            Write-Host "  ✅ $var = $value" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ $var = NOT SET" -ForegroundColor Red
        $missing += $var
    }
}

if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Missing required variables: $($missing -join ', ')" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Testing SMTP Connection..." -ForegroundColor Cyan

# Test actual SMTP connection using PowerShell
$smtpHost = [Environment]::GetEnvironmentVariable('SMTP_HOST', 'Process')
$smtpPort = [Environment]::GetEnvironmentVariable('SMTP_PORT', 'Process')
$smtpUser = [Environment]::GetEnvironmentVariable('SMTP_USER', 'Process')
$smtpPass = [Environment]::GetEnvironmentVariable('SMTP_PASS', 'Process')
$businessEmail = [Environment]::GetEnvironmentVariable('BUSINESS_EMAIL', 'Process')

try {
    Write-Host "  Host: $smtpHost" -ForegroundColor Gray
    Write-Host "  Port: $smtpPort" -ForegroundColor Gray
    Write-Host "  User: $smtpUser" -ForegroundColor Gray
    Write-Host ""
    
    # Create email message
    $message = New-Object System.Net.Mail.MailMessage
    $message.From = "$smtpUser"
    $message.To.Add($businessEmail)
    $message.Subject = "Test Email - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    $message.Body = @"
This is a test email to verify SMTP configuration.

Sent at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
From: VortexPCs Email Test Script

If you receive this, your SMTP configuration is working correctly!
"@
    
    # Create SMTP client
    $smtp = New-Object System.Net.Mail.SmtpClient($smtpHost, $smtpPort)
    $smtp.EnableSsl = $true
    $smtp.Credentials = New-Object System.Net.NetworkCredential($smtpUser, $smtpPass)
    
    # Send email
    Write-Host "  📤 Sending test email..." -ForegroundColor Yellow
    $smtp.Send($message)
    
    Write-Host ""
    Write-Host "✅ SUCCESS! Test email sent successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 Email Details:" -ForegroundColor Cyan
    Write-Host "  From: $smtpUser" -ForegroundColor Gray
    Write-Host "  To: $businessEmail" -ForegroundColor Gray
    Write-Host "  Subject: $($message.Subject)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "✅ Your SMTP configuration is working!" -ForegroundColor Green
    Write-Host "✅ Shopping cart emails should work after deployment" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ SMTP TEST FAILED!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error Message:" -ForegroundColor Yellow
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Common Issues:" -ForegroundColor Yellow
    Write-Host "  1. Wrong SMTP credentials" -ForegroundColor Gray
    Write-Host "  2. SMTP server blocking connections" -ForegroundColor Gray
    Write-Host "  3. Port $smtpPort is blocked by firewall" -ForegroundColor Gray
    Write-Host "  4. SSL/TLS configuration mismatch" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Verify SMTP credentials with your email provider" -ForegroundColor Gray
    Write-Host "  2. Try port 587 with TLS instead of 465 with SSL" -ForegroundColor Gray
    Write-Host "  3. Check if your email provider requires app-specific passwords" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "NEXT: Deploy changes to Vercel" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run:" -ForegroundColor Yellow
Write-Host "  vercel --prod" -ForegroundColor White
Write-Host ""
