# Fix dark button hover states across all components

$files = @(
    "components\PCBuilder.tsx",
    "components\PCFinderBlue.tsx",
    "components\AdminPanel.tsx",
    "components\MemberArea.tsx",
    "components\RepairService.tsx",
    "components\AIAssistant.tsx",
    "components\OrderSuccess.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $content = Get-Content $file -Raw
        
        # Replace dark black hovers with lighter white hovers
        $content = $content -replace 'hover:bg-black/70', 'hover:bg-white/20'
        $content = $content -replace 'hover:bg-black/80', 'hover:bg-white/25'
        $content = $content -replace 'hover:bg-black/90', 'hover:bg-white/30'
        
        # Replace dark gradient hovers with lighter versions
        $content = $content -replace 'hover:from-sky-700', 'hover:from-sky-500'
        $content = $content -replace 'hover:to-blue-700', 'hover:to-blue-500'
        $content = $content -replace 'hover:from-blue-700', 'hover:from-blue-500'
        $content = $content -replace 'hover:to-purple-700', 'hover:to-purple-500'
        $content = $content -replace 'hover:from-purple-700', 'hover:from-purple-500'
        $content = $content -replace 'hover:from-green-700', 'hover:from-green-500'
        $content = $content -replace 'hover:to-emerald-700', 'hover:to-emerald-500'
        $content = $content -replace 'hover:from-emerald-700', 'hover:from-emerald-500'
        $content = $content -replace 'hover:from-yellow-700', 'hover:from-yellow-500'
        $content = $content -replace 'hover:to-orange-700', 'hover:to-orange-500'
        $content = $content -replace 'hover:from-orange-700', 'hover:from-orange-500'
        $content = $content -replace 'hover:from-indigo-700', 'hover:from-indigo-500'
        $content = $content -replace 'hover:to-indigo-700', 'hover:to-indigo-500'
        
        # Replace solid color hovers
        $content = $content -replace 'hover:bg-sky-700', 'hover:bg-sky-500'
        $content = $content -replace 'hover:bg-blue-700', 'hover:bg-blue-500'
        $content = $content -replace 'hover:bg-purple-700', 'hover:bg-purple-500'
        $content = $content -replace 'hover:bg-green-700', 'hover:bg-green-500'
        $content = $content -replace 'hover:bg-red-700', 'hover:bg-red-500'
        $content = $content -replace 'hover:bg-yellow-700', 'hover:bg-yellow-500'
        $content = $content -replace 'hover:bg-orange-700', 'hover:bg-orange-500'
        $content = $content -replace 'hover:bg-indigo-700', 'hover:bg-indigo-500'
        
        # Replace dark base colors on buttons to lighter
        $content = $content -replace 'bg-black/50 backdrop-blur-md', 'bg-white/10 backdrop-blur-md'
        $content = $content -replace 'bg-black/60 backdrop-blur-md', 'bg-white/10 backdrop-blur-md'
        $content = $content -replace 'bg-black/70 backdrop-blur-md', 'bg-white/15 backdrop-blur-md'
        
        Set-Content $file -Value $content -NoNewline
        Write-Host "Success: $file updated" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Success: All button hover states updated to lighter colors!" -ForegroundColor Green
