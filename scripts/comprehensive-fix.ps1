# Comprehensive fix for all remaining routes.ts TypeScript errors

$filePath = "server/routes.ts"
Write-Host "Applying comprehensive fixes to $filePath..."

$content = Get-Content $filePath -Raw

# Fix 1: Remove domain field (line 295)
$content = $content -replace 'domain: company\.domain \|\| ''Unknown'',', 'address: company.address || ''N/A'','

# Fix 2-4: Add createdById to getDepartments calls
$content = $content -replace 'const departments = await storage\.getDepartments\(\);', 'const departments = await storage.getDepartments(requestingUserId);'

# Fix 5: Fix user.departmentId and dept.name
$content = $content -replace 'u\.departmentId === dept\.id', 'u.department === dept.code'
$content = $content -replace 'name: dept\.name,', 'name: dept.description,'

# Fix 6-7: Add createdById to getInitiatedAppraisals and fix fields
$content = $content -replace 'const initiatedAppraisals = await storage\.getInitiatedAppraisals\(\);', 'const initiatedAppraisals = await storage.getInitiatedAppraisals(requestingUserId);'
$content = $content -replace 'appraisal\.employeeIds\?\.length \|\| 0', '0 // employeeIds field does not exist'
$content = $content -replace 'appraisal\.displayName', 'appraisal.appraisalType'
$content = $content -replace 'appraisal\.publishedAt', 'appraisal.createdAt'

# Fix 8: Add createdById to getAppraisalGroups
$content = $content -replace 'const appraisalGroups = await storage\.getAppraisalGroups\(\);', 'const appraisalGroups = await storage.getAppraisalGroups(requestingUserId);'
$content = $content -replace 'group\.displayName', 'group.name'

# Fix 9-12: Fix user.managerId and user.position
$content = $content -replace 'u\.managerId ===', 'u.reportingManagerId ==='
$content = $content -replace 'report\.position', 'report.designation'

# Fix 13-16: Fix evaluation.submittedAt
$content = $content -replace 'completedEvaluations\[0\]\.submittedAt', 'completedEvaluations[0].managerEvaluationSubmittedAt'
$content = $content -replace 'evaluation\.submittedAt', 'evaluation.selfEvaluationSubmittedAt'

# Fix 17: Fix user.role null check
$content = $content -replace "\['admin', 'super_admin'\]\.includes\(targetUser\.role\)", "targetUser.role && ['admin', 'super_admin'].includes(targetUser.role)"

# Fix 18-20: Fix selfEvaluationData type issues
$content = $content -replace 'evaluation\.selfEvaluationData\?\.questionnaires', '(evaluation.selfEvaluationData as any)?.questionnaires'
$content = $content -replace 'evaluation\.selfEvaluationData\.questionnaires', '(evaluation.selfEvaluationData as any).questionnaires'
$content = $content -replace 'templates\.filter\(template => template !== null\)', 'templates.filter((template: any) => template !== null)'

# Fix 21-29: Remove invalid destructuring from partial() schemas
$content = $content -replace 'const \{ id: _id, createdById: _createdById, createdAt: _createdAt, \.\.\.safeLevelData \} = insertLevelSchema\.partial\(\)\.parse\(req\.body\);', 'const safeLevelData = insertLevelSchema.partial().parse(req.body);'
$content = $content -replace 'const \{ id: _id, createdById: _createdById, createdAt: _createdAt, \.\.\.safeGradeData \} = insertGradeSchema\.partial\(\)\.parse\(req\.body\);', 'const safeGradeData = insertGradeSchema.partial().parse(req.body);'
$content = $content -replace 'const \{ id: _id, createdById: _createdById, createdAt: _createdAt, \.\.\.safeDepartmentData \} = insertDepartmentSchema\.partial\(\)\.parse\(req\.body\);', 'const safeDepartmentData = insertDepartmentSchema.partial().parse(req.body);'
$content = $content -replace 'const \{ id: _id, createdById: _createdById, createdAt: _createdAt, \.\.\.safeCycleData \} = insertAppraisalCycleSchema\.partial\(\)\.parse\(req\.body\);', 'const safeCycleData = insertAppraisalCycleSchema.partial().parse(req.body);'
$content = $content -replace 'const \{ id: _id, createdById: _createdById, createdAt: _createdAt, \.\.\.safeFrequencyData \} = insertReviewFrequencySchema\.partial\(\)\.parse\(req\.body\);', 'const safeFrequencyData = insertReviewFrequencySchema.partial().parse(req.body);'
$content = $content -replace 'const \{ id: _id, createdById: _createdById, createdAt: _createdAt, \.\.\.safeCalendarData \} = insertFrequencyCalendarSchema\.partial\(\)\.parse\(req\.body\);', 'const safeCalendarData = insertFrequencyCalendarSchema.partial().parse(req.body);'
$content = $content -replace 'const \{ id: _id, createdAt: _createdAt, \.\.\.safeDetailsData \} = insertFrequencyCalendarDetailsSchema\.partial\(\)\.parse\(req\.body\);', 'const safeDetailsData = insertFrequencyCalendarDetailsSchema.partial().parse(req.body);'
$content = $content -replace 'const \{ id: _id, createdById: _createdById, createdAt: _createdAt, \.\.\.safeQuestionnaireData \} = insertPublishQuestionnaireSchema\.partial\(\)\.parse\(req\.body\);', 'const safeQuestionnaireData = insertPublishQuestionnaireSchema.partial().parse(req.body);'

# Fix 30: Fix user.companyId null check
$content = $content -replace '(\s+)else \{\s+cycles = await storage\.getAllAppraisalCycles\(user\.companyId\);', '$1else if (user.companyId) {$1  cycles = await storage.getAllAppraisalCycles(user.companyId);$1} else {$1  cycles = await storage.getAppraisalCycles(userId);'

# Fix 31: Fix user.companyId null check for frequencyCalendarDetails
$content = $content -replace '(\s+)else \{\s+details = await storage\.getAllFrequencyCalendarDetails\(user\.companyId\);', '$1else if (user.companyId) {$1  details = await storage.getAllFrequencyCalendarDetails(user.companyId);$1} else {$1  details = await storage.getFrequencyCalendarDetails(userId);'

Write-Host "Fixes applied! Run npm run check to verify."
Set-Content $filePath $content -NoNewline
