-- Fix existing evaluations with invalid reviewCycleId
-- These were created with the bug where reviewCycleId was set to "initiated-appraisal-{guid}"
-- Should be NULL for evaluations linked to initiated appraisals

UPDATE dbo.evaluations
SET review_cycle_id = NULL
WHERE review_cycle_id LIKE 'initiated-appraisal-%'
  AND initiated_appraisal_id IS NOT NULL;

-- Verify the fix
SELECT 
  id,
  employee_id,
  manager_id,
  review_cycle_id,
  initiated_appraisal_id,
  status
FROM dbo.evaluations
WHERE initiated_appraisal_id IS NOT NULL
ORDER BY created_at DESC;
