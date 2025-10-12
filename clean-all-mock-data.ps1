# Complete Mock Data Cleanup Script
$pagesDir = "client/src/pages"

Write-Host "Starting complete mock data cleanup..."

# List of all pages to clean
$pages = @(
    "Advertising.tsx",
    "AIInsights.tsx", 
    "Analytics.tsx",
    "CostManagement.tsx",
    "Dashboard.tsx",
    "EnhancedAIInsights.tsx",
    "GeographicMap.tsx",
    "LiveCustomerView.tsx",
    "Orders.tsx",
    "PaymentProviders.tsx",
    "Products.tsx",
    "ProfitAnalytics.tsx",
    "SaaSDashboard.tsx",
    "ShippingRules.tsx",
    "ShippingTax.tsx"
)

foreach ($page in $pages) {
    $filePath = Join-Path $pagesDir $page
    
    if (Test-Path $filePath) {
        Write-Host "Cleaning: $page"
        
        # Read file
        $content = Get-Content $filePath -Raw
        
        # Replace common mock patterns
        $content = $content -replace 'Math\.random\(\)\s*\*\s*\d+', '0'
        $content = $content -replace '\d+\s*\+\s*Math\.random\(\)\s*\*\s*\d+', '0'
        $content = $content -replace 'Math\.floor\(Math\.random\(\).*?\)', '0'
        
        # Set file back
        Set-Content $filePath -Value $content -NoNewline
    }
}

Write-Host "Cleanup complete!"
Write-Host "Counting remaining mock references..."

$mockCount = (Select-String -Path "$pagesDir/*.tsx" -Pattern "mock|Math\.random" -CaseSensitive:$false | Measure-Object).Count
Write-Host "Remaining mock references: $mockCount"

