# PowerShell script to fix all remaining TypeScript errors in routes.ts

$filePath = "server/routes.ts"
Write-Host "Fixing remaining TypeScript errors in $filePath..."

# Read the file
$content = Get-Content $filePath -Raw

# Fix 1: email null checks - add || '' for all employee.email and manager.email followed by comma
$content = $content -replace '([^\w])employee\.email,', '$1employee.email || ''''_,'
$content = $content -replace '([^\w])manager\.email,', '$1manager.email || '''','

# Fix 2: managerId null checks in evaluation creation
$content = $content -replace 'let managerId = employee\.reportingManagerId;\s+if \(!managerId\) \{\s+managerId = (\w+);\s+\}', 'let managerId = employee.reportingManagerId || $1;'

# Fix 3: Remove meetingDetails from evaluation update (doesn't exist in schema)
$content = $content -replace 'meetingDetails: meetingDetails,?\s*\n', ''

# Fix 4: Fix employeeData null issues
$content = $content -replace 'code: (\w+)\.code,', 'code: $1.code || undefined,'
$content = $content -replace 'email: (\w+)\.email,', 'email: $1.email || undefined,'

# Fix 5: Fix error type casting - add type guards
$content = $content -replace '(\s+)if \(error\.name === ''ZodError''\) \{', '$1if (error instanceof Error && error.name === ''ZodError'') {'
$content = $content -replace '(\s+)if \(error\.message\.includes\(', '$1if (error instanceof Error && error.message.includes('
$content = $content -replace '(\s+)if \(error\.message\?\.includes\(', '$1if (error instanceof Error && error.message?.includes('
$content = $content -replace 'error\.message\)', '(error as Error).message)'
$content = $content -replace 'error\.errors', '(error as any).errors'
$content = $content -replace 'taskError\.message', '(taskError as Error).message'

# Fix 6: Fix selfEvaluationData.questionnaires type issue
$content = $content -replace 'evaluation\.selfEvaluationData\?\.questionnaires', '(evaluation.selfEvaluationData as any)?.questionnaires'

# Fix 7: Fix template filter - add type annotation
$content = $content -replace 'templates\.filter\(template => template !== null\)', 'templates.filter((template: any) => template !== null)'

# Write back
Set-Content $filePath $content -NoNewline

Write-Host "Done! Please review the changes and run 'npm run check' to verify."
