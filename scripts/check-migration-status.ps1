# Storage.ts Migration Completion Script
# This script helps complete the conversion from Drizzle ORM to MSSQL SPs

Write-Host "========================================"
Write-Host "Storage.ts Migration Status"
Write-Host "========================================"
Write-Host ""

$storagePath = "d:\PMS - v1\PerformMgmt\server\storage.ts"

# Count remaining db. references
$dbReferences = Select-String -Path $storagePath -Pattern "await db\." | Measure-Object | Select-Object -ExpandProperty Count
Write-Host "Remaining 'await db.' references: $dbReferences"

# Count remaining eq( references
$eqReferences = Select-String -Path $storagePath -Pattern "\beq\(" | Measure-Object | Select-Object -ExpandProperty Count
Write-Host "Remaining 'eq(' references: $eqReferences"

# Count remaining and( references
$andReferences = Select-String -Path $storagePath -Pattern "\band\(" | Measure-Object | Select-Object -ExpandProperty Count
Write-Host "Remaining 'and(' references: $andReferences"

Write-Host ""
Write-Host "Methods that still need conversion:"
Write-Host ""

# List methods that still use db
$methodsWithDb = Select-String -Path $storagePath -Pattern "async \w+\(" -Context 0,15 | Where-Object {
    $_.Context.PostContext -match "await db\."
} | ForEach-Object {
    if ($_.Line -match "async (\w+)\(") {
        $matches[1]
    }
} | Select-Object -Unique

$methodsWithDb | ForEach-Object {
    Write-Host "  - $_"
}

Write-Host ""
Write-Host "========================================"
Write-Host "Next Steps:"
Write-Host "========================================"
Write-Host "1. Review REMAINING_CONVERSIONS.md for conversion patterns"
Write-Host "2. Use STORAGE_CONVERSION_GUIDE.md for detailed examples"
Write-Host "3. Reference server/storage_sp_template.ts for working code"
Write-Host "4. Apply conversions method by method"
Write-Host ""
Write-Host "Estimated remaining work: $($dbReferences * 2) minutes ($dbReferences methods × 2 min each)"
Write-Host ""
