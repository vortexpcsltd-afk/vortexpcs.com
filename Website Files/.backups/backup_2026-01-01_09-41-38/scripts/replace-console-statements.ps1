# PowerShell script to replace console statements with logger calls
# Run from project root: .\scripts\replace-console-statements.ps1

$files = @(
    "components\HomePage.tsx",
    "components\PCBuilder.tsx",
    "components\PCFinderBlue.tsx",
    "components\MemberArea.tsx",
    "components\AdminPanel.tsx",
    "components\LoginDialog.tsx",
    "components\FAQPage.tsx",
    "components\RepairService.tsx",
    "components\EnthusiastBuilder.tsx",
    "components\Contact.tsx",
    "components\CheckoutPage.tsx",
    "components\ErrorBoundary.tsx",
    "components\ChatbotWidget.tsx",
    "components\VisualPCConfigurator.tsx",
    "services\cms.ts",
    "services\errorLogger.ts",
    "services\chatbot.ts",
    "services\buildSharing.ts",
    "config\firebase.ts",
    "config\stripe.ts",
    "config\address.ts",
    "main.tsx"
)

$replacements = @{
    'console\.log\(' = 'logger.debug('
    'console\.error\(' = 'logger.error('
    'console\.warn\(' = 'logger.warn('
    'console\.info\(' = 'logger.info('
}

$importStatement = 'import { logger } from "../services/logger";'
$importStatementRoot = 'import { logger } from "./services/logger";'

Write-Host "Starting console statement replacement..." -ForegroundColor Cyan

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot ".." $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $fullPath -Raw
        $originalContent = $content
        
        # Add import if console statements exist
        if ($content -match "console\.(log|error|warn|info)\(") {
            # Determine correct import path
            $import = if ($file -match "^(main|App)\.tsx") { $importStatementRoot } else { $importStatement }
            
            # Add import after last import statement if not already present
            if ($content -notmatch "from.*logger") {
                $content = $content -replace '(import.*\n)(?!import)', "`$1$import`n"
            }
            
            # Replace console statements
            foreach ($pattern in $replacements.Keys) {
                $replacement = $replacements[$pattern]
                $content = $content -replace $pattern, $replacement
            }
            
            # Write back if changed
            if ($content -ne $originalContent) {
                Set-Content $fullPath -Value $content -NoNewline
                Write-Host "  ✓ Updated $file" -ForegroundColor Green
            } else {
                Write-Host "  - No changes needed for $file" -ForegroundColor Gray
            }
        } else {
            Write-Host "  - No console statements found in $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`nConsole statement replacement complete!" -ForegroundColor Cyan
Write-Host "Note: Some console statements may need manual review for context parameters" -ForegroundColor Yellow
