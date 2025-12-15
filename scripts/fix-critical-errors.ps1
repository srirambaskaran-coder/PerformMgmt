# Fix remaining critical errors

$filePath = "server/routes.ts"
$content = Get-Content $filePath -Raw

# Fix user.companyId null checks - these didn't work with regex, use literal text
$before1 = @"
      if (user.role === 'super_admin') {
        cycles = await storage.getAppraisalCycles(userId);
      } else {
        cycles = await storage.getAllAppraisalCycles(user.companyId);
      }
"@

$after1 = @"
      if (user.role === 'super_admin') {
        cycles = await storage.getAppraisalCycles(userId);
      } else if (user.companyId) {
        cycles = await storage.getAllAppraisalCycles(user.companyId);
      } else {
        cycles = await storage.getAppraisalCycles(userId);
      }
"@

$content = $content -replace [regex]::Escape($before1), $after1

# Fix 2: FrequencyCalendarDetails companyId check
$before2 = @"
      if (user.role === 'super_admin') {
        details = await storage.getFrequencyCalendarDetails(userId);
      } else {
        details = await storage.getAllFrequencyCalendarDetails(user.companyId);
      }
"@

$after2 = @"
      if (user.role === 'super_admin') {
        details = await storage.getFrequencyCalendarDetails(userId);
      } else if (user.companyId) {
        details = await storage.getAllFrequencyCalendarDetails(user.companyId);
      } else {
        details = await storage.getFrequencyCalendarDetails(userId);
      }
"@

$content = $content -replace [regex]::Escape($before2), $after2

# Fix 3: managerId null in evaluationData
$content = $content -replace 'let managerId = employee\.reportingManagerId;[\s\S]{0,100}if \(!managerId\) \{[\s\S]{0,50}managerId = userId;[\s\S]{0,50}\}', 'let managerId = employee.reportingManagerId || userId;'

# Fix 4: email null checks - add || '' for all sendEmail calls with employee.email
$content = $content -replace '([,\(]\s*)employee\.email([,\)])', '$1employee.email || ''''$2'
$content = $content -replace '([,\(]\s*)manager\.email([,\)])', '$1manager.email || ''''$2'

# Fix 5: error type unknown - add type assertions
$content = $content -replace 'catch \(error\) \{[\s\r\n\s]+(console\.error|res\.status)', 'catch (error: unknown) {$1'
$content = $content -replace '\} catch \(error\) \{', '} catch (error: unknown) {'
$content = $content -replace 'error\.message', '(error as Error).message'
$content = $content -replace '\(error as Error\) as Error', 'error as Error'

# Fix 6: Remove Drizzle references (db, eq, initiatedAppraisals, etc.)
$drizzlePattern = @"
const \[appraisal\] = await db\.select\(\)\.from\(initiatedAppraisals\)\.where\(eq\(initiatedAppraisals\.id, task\.initiatedAppraisalId\)\);
"@
$drizzleReplacement = @"
const appraisal = await storage.getInitiatedAppraisal(task.initiatedAppraisalId);
"@
$content = $content -replace [regex]::Escape($drizzlePattern), $drizzleReplacement

$drizzlePattern2 = @"
const \[calendarDetail\] = await db\.select\(\)\.from\(frequencyCalendarDetails\)\.where\(eq\(frequencyCalendarDetails\.id, task\.frequencyCalendarDetailId\)\);
"@
$drizzleReplacement2 = @"
const calendarDetail = await storage.getFrequencyCalendarDetail(task.frequencyCalendarDetailId);
"@
$content = $content -replace [regex]::Escape($drizzlePattern2), $drizzleReplacement2

$drizzlePattern3 = @"
const \[timingConfig\] = await db\.select\(\)\.from\(initiatedAppraisalDetailTimings\)\.where\(
            and\(
              eq\(initiatedAppraisalDetailTimings\.initiatedAppraisalId, appraisal\.id\),
              eq\(initiatedAppraisalDetailTimings\.frequencyCalendarDetailId, calendarDetail\.id\)
            \)
          \);
"@
$drizzleReplacement3 = @"
const allTimings = await storage.getInitiatedAppraisalDetailTimings(appraisal.id);
          const timingConfig = allTimings.find(t => 
            t.initiatedAppraisalId === appraisal.id && 
            t.frequencyCalendarDetailId === calendarDetail.id
          );
"@
$content = $content -replace [regex]::Escape($drizzlePattern3), $drizzleReplacement3

Write-Host "Additional fixes applied!"
Set-Content $filePath $content -NoNewline
