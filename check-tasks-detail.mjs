import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkChecklistTasks() {
  console.log('📝 Detailed Task Information\n');

  try {
    // Get all tasks with more details
    const { data: tasks, error: tasksError } = await supabase
      .from('checklist_tasks')
      .select(`
        id,
        staff_id,
        status,
        template_id,
        assignment_id,
        assigned_at,
        created_at,
        checklist_templates(name)
      `);

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError.message);
      return;
    }

    console.log(`Total Tasks: ${tasks?.length || 0}\n`);

    if (tasks && tasks.length > 0) {
      tasks.forEach(t => {
        console.log(`Task: ${t.id?.slice(0, 8)}...`);
        console.log(`  Template: ${t.checklist_templates?.name}`);
        console.log(`  Status: ${t.status}`);
        console.log(`  Staff ID: ${t.staff_id}`);
        console.log(`  Assignment ID: ${t.assignment_id?.slice(0, 8)}...`);
        console.log(`  Created: ${new Date(t.created_at).toLocaleString()}`);
        console.log('');
      });
    }

    // Check which staff these correspond to
    const staffIds = [...new Set(tasks?.map(t => t.staff_id) || [])];
    
    console.log(`\n👥 Staff assigned to tasks: ${staffIds.length}`);
    for (const staffId of staffIds) {
      const { data: staffData } = await supabase
        .from('user_roles')
        .select('id, user_id, staff_code, role')
        .eq('id', staffId)
        .single();
      
      if (staffData) {
        console.log(`  - ${staffData.staff_code || staffData.user_id || staffData.id} (${staffData.role})`);
      } else {
        console.log(`  - ID: ${staffId} (not found in user_roles)`);
      }
    }

    // Get all staff that SHOULD have tasks
    console.log(`\n👥 All staff in system:`);
    const { data: allStaff } = await supabase
      .from('user_roles')
      .select('id, user_id, staff_code, role');
    
    if (allStaff) {
      allStaff.forEach(s => {
        const hasTask = staffIds.includes(s.id);
        console.log(`  - ${s.staff_code || s.user_id || s.id} (${s.role}) ${hasTask ? '✅ HAS TASK' : '❌ NO TASKS'}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkChecklistTasks();
