import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    broadcast: { ack: false },
    presence: { key: '' }
  },
  db: {
    schema: 'public'
  }
});

async function checkTasks() {
  console.log('🔍 Checking Staff Checklist Tasks...\n');

  try {
    // Get all staff members
    const { data: staffData, error: staffError } = await supabase
      .from('user_roles')
      .select('id, user_id, role, store_id')
      .eq('role', 'staff');

    if (staffError) {
      console.error('Error fetching staff:', staffError);
      return;
    }

    console.log(`📊 Total Staff Members: ${staffData.length}`);
    console.log('Staff IDs:', staffData.map(s => ({ id: s.id, user_id: s.user_id })));

    // Get all checklist tasks
    const { data: tasks, error: tasksError } = await supabase
      .from('checklist_tasks')
      .select('id, staff_id, status, created_at, checklist_templates(name)');

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      return;
    }

    console.log(`\n📋 Total Checklist Tasks: ${tasks.length}`);
    
    if (tasks.length === 0) {
      console.log('⚠️  NO TASKS FOUND IN DATABASE!');
      console.log('\nThis is why staff members see "All Caught Up!"');
      return;
    }

    console.log('\n Task Details:');
    tasks.forEach(task => {
      console.log(`  - ${task.checklist_templates?.name || 'Unknown'}`);
      console.log(`    Staff ID: ${task.staff_id}`);
      console.log(`    Status: ${task.status}`);
      console.log(`    Created: ${task.created_at}\n`);
    });

    // Check for unassigned tasks
    const { data: unassignedTasks, error: unassignedError } = await supabase
      .from('checklist_tasks')
      .select('id, staff_id')
      .is('staff_id', null);

    if (unassignedError) {
      console.error('Error checking unassigned tasks:', unassignedError);
    } else if (unassignedTasks.length > 0) {
      console.log(`\n⚠️  ${unassignedTasks.length} tasks are UNASSIGNED (staff_id is NULL)`);
    }

    // Check staff-task mapping
    console.log('\n👥 Staff-Task Mapping:');
    for (const staff of staffData) {
      const { data: staffTasks, error: mappingError } = await supabase
        .from('checklist_tasks')
        .select('id, status')
        .eq('staff_id', staff.id);

      if (mappingError) {
        console.error(`Error for staff ${staff.id}:`, mappingError);
      } else {
        console.log(`  Staff ID ${staff.id.substring(0, 8)}...: ${staffTasks.length} tasks`);
        if (staffTasks.length > 0) {
          const pending = staffTasks.filter(t => t.status === 'pending').length;
          console.log(`    - Pending: ${pending}`);
        }
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTasks();
