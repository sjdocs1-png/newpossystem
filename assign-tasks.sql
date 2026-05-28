-- Assign Checklist Tasks to All Staff Members

-- First, get all staff members and templates
-- Then create tasks for each staff member

-- Get one staff member and one template for testing
SELECT 
  'Step 1: Checking data' as status,
  (SELECT COUNT(*) FROM user_roles WHERE role = 'staff') as staff_count,
  (SELECT COUNT(*) FROM checklist_templates) as template_count,
  (SELECT COUNT(*) FROM checklist_tasks) as existing_tasks;

-- Create tasks for all staff members and all templates
INSERT INTO checklist_tasks (
  staff_id,
  store_id,
  template_id,
  status,
  assigned_at,
  due_at,
  created_at
)
SELECT 
  ur.id as staff_id,
  ur.store_id,
  ct.id as template_id,
  'pending'::text,
  NOW(),
  NOW() + INTERVAL '1 day',
  NOW()
FROM user_roles ur
CROSS JOIN checklist_templates ct
WHERE ur.role = 'staff'
  AND ur.store_id = ct.store_id
  AND NOT EXISTS (
    -- Don't create duplicate tasks
    SELECT 1 FROM checklist_tasks ct2
    WHERE ct2.staff_id = ur.id
      AND ct2.template_id = ct.id
      AND ct2.status IN ('pending', 'in_progress')
  );

-- Verify tasks were created
SELECT 
  'Task Assignment Complete' as status,
  COUNT(*) as total_tasks_created
FROM checklist_tasks
WHERE assigned_at > NOW() - INTERVAL '1 minute';
