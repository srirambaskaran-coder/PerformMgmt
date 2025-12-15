# PowerShell script to fix remaining routes.ts TypeScript errors

$filePath = "server/routes.ts"
$content = Get-Content $filePath -Raw

# Fix: employee.email, -> employee.email || '',
$content = $content -replace '(\s+)(employee\.email|manager\.email),(\s*\n)', '$1$2 || '''',$ Human: continue fixing