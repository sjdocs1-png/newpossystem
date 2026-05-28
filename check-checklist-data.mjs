import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkChecklistData() {
  console.log('🔍 Checking Checklist Data...\n');

  try {
    // Get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('checklist_templates')
      .select('id, name, checklist_type, is_active');

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError.message);
    } else {
      console.log(`📋 Templates (${templates?.length || 0}):`);
      if (templates && templates.length > 0) {
        templates.forEach(t => console.log(`  - ${t.name} (${t.checklist_type}) [Active: ${t.is_active}]`));
      } else {
        console.log('  No templates found');
      }
    }

    console.log('');

    // Get all assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('checklist_assignments')
      .select('id, template_id, staff_ids, is_active');

    if (assignmentsError) {
      console.error('❌ Error fetching assignments:', assignmentsError.message);
    } else {
      console.log(`📌 Assignments (${assignments?.length || 0}):`);
      if (assignments && assignments.length > 0) {
        assignments.forEach(a => console.log(`  - Assignment ${a.id?.slice(0, 8)}... [Staff IDs: ${a.staff_ids?.length || 0}, Active: ${a.is_active}]`));
      } else {
        console.log('  No assignments found');
      }
    }

    console.log('');

    // Get all tasks by status
    const { data: allTasks, error: tasksError } = await supabase
      .from('checklist_tasks')
      .select('id, staff_id, status, assigned_at, created_at');

    if (tasksError) {
      console.error('❌ Error fetching tasks:', tasksError.message);
    } else {
      console.log(`📝 Total Tasks: ${allTasks?.length || 0}`);
      
      if (allTasks && allTasks.length > 0) {
        const byStatus = {};
        allTasks.forEach(t => {
          byStatus[t.status] = (byStatus[t.status] || 0) + 1;
        });
        console.log('  Status breakdown:');
        Object.entries(byStatus).forEach(([status, count]) => {
          console.log(`    - ${status}: ${count}`);
        });
        
        console.log('\n  First 5 tasks:');
        allTasks.slice(0, 5).forEach(t => {
          console.log(`    - Task ${t.id?.slice(0, 8)}... | Status: ${t.status} | Staff: ${t.staff_id?.slice(0, 8)}...`);
        });
      } else {
        console.log('  No tasks found');
      }
    }

    console.log('');

    // Get all staff
    const { data: staff, error: staffError } = await supabase
      .from('user_roles')
      .select('id, user_id, role, staff_code');

    if (staffError) {
      console.error('❌ Error fetching staff:', staffError.message);
    } else {
      console.log(`👥 Staff Members (${staff?.length || 0}):`);
      if (staff && staff.length > 0) {
        staff.slice(0, 5).forEach(s => console.log(`  - ${s.staff_code || s.user_id || s.id} (${s.role})`));
        if (staff.length > 5) console.log(`  ... and ${staff.length - 5} more`);
      } else {
        console.log('  No staff found');
      }
    }

    console.log('\n✅ Check complete!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkChecklistData();
