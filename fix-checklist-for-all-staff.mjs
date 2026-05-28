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

async function fixChecklistAssignments() {
  console.log('🔧 Fixing Checklist Assignments for All Staff\n');

  try {
    // Get store ID from existing tasks
    const { data: existingTasks, error: tasksError } = await supabase
      .from('checklist_tasks')
      .select('store_id, template_id')
      .limit(1)
      .single();

    if (tasksError) {
      console.error('❌ Error fetching store ID:', tasksError.message);
      return;
    }

    const storeId = existingTasks?.store_id;
    if (!storeId) {
      console.log('❌ No store ID found');
      return;
    }

    console.log(`✅ Store ID: ${storeId}\n`);

    // Get all active templates
    const { data: templates, error: templateError } = await supabase
      .from('checklist_templates')
      .select('id, name, is_active')
      .eq('store_id', storeId)
      .eq('is_active', true);

    if (templateError) {
      console.error('❌ Error fetching templates:', templateError.message);
      return;
    }

    console.log(`📋 Found ${templates?.length || 0} active templates\n`);

    // Get all staff for this store (both store_manager and staff roles)
    const { data: allStaff, error: staffError } = await supabase
      .from('user_roles')
      .select('id, staff_code, role')
      .eq('store_id', storeId)
      .in('role', ['store_manager', 'staff']);

    if (staffError) {
      console.error('❌ Error fetching staff:', staffError.message);
      return;
    }

    console.log(`👥 Found ${allStaff?.length || 0} staff members:`);
    allStaff?.forEach(s => console.log(`   - ${s.staff_code} (${s.role})`));
    console.log('');

    // Get existing tasks to see the pattern
    const { data: existingTasksList, error: existingError } = await supabase
      .from('checklist_tasks')
      .select('staff_id, template_id');

    if (existingError) {
      console.error('❌ Error fetching existing tasks:', existingError.message);
      return;
    }

    // Determine which templates need more staff assignments
    const templateTaskMap = {};
    existingTasksList?.forEach(task => {
      if (!templateTaskMap[task.template_id]) {
        templateTaskMap[task.template_id] = new Set();
      }
      templateTaskMap[task.template_id].add(task.staff_id);
    });

    console.log('📝 Current task assignments:');
    Object.entries(templateTaskMap).forEach(([templateId, staffIds]) => {
      const template = templates?.find(t => t.id === templateId);
      console.log(`   ${template?.name}: ${staffIds.size} staff member(s)`);
    });
    console.log('');

    // Create tasks for missing staff
    let tasksCreated = 0;

    for (const template of templates || []) {
      const assignedStaff = templateTaskMap[template.id] || new Set();
      const missingStaff = (allStaff || []).filter(s => !assignedStaff.has(s.id));

      if (missingStaff.length > 0) {
        console.log(`📌 Adding ${missingStaff.length} staff to "${template.name}":`);

        // Get customer ID from existing task
        const { data: sampleTask } = await supabase
          .from('checklist_tasks')
          .select('customer_id, assignment_id')
          .eq('template_id', template.id)
          .limit(1)
          .single();

        const customerId = sampleTask?.customer_id;
        const assignmentId = sampleTask?.assignment_id;

        if (!customerId || !assignmentId) {
          console.log(`⚠️  Could not find customer/assignment info for this template`);
          continue;
        }

        // Calculate due date (24 hours from now by default)
        const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        const newTasks = missingStaff.map(staff => ({
          assignment_id: assignmentId,
          template_id: template.id,
          customer_id: customerId,
          store_id: storeId,
          staff_id: staff.id,
          status: 'pending',
          assigned_at: new Date().toISOString(),
          due_at: dueAt,
        }));

        const { data: created, error: insertError } = await supabase
          .from('checklist_tasks')
          .insert(newTasks)
          .select('id');

        if (insertError) {
          console.error(`   ❌ Error creating tasks:`, insertError.message);
        } else {
          tasksCreated += created?.length || 0;
          missingStaff.forEach(staff => {
            console.log(`   ✅ Assigned to ${staff.staff_code} (${staff.role})`);
          });
        }
      } else {
        console.log(`✅ "${template.name}": Already assigned to all staff`);
      }
    }

    console.log(`\n✅ Done! Created ${tasksCreated} new tasks`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixChecklistAssignments();
