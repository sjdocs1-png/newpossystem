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

async function fixChecklistAssignmentsV2() {
  console.log('🔧 Fixing Checklist Assignments for All Staff (V2)\n');

  try {
    // Get store ID
    const { data: sampleTask, error: sampleError } = await supabase
      .from('checklist_tasks')
      .select('store_id, customer_id')
      .limit(1)
      .single();

    if (sampleError || !sampleTask) {
      console.error('❌ Error: No tasks found in database');
      return;
    }

    const storeId = sampleTask.store_id;
    const customerId = sampleTask.customer_id;

    console.log(`✅ Store ID: ${storeId}`);
    console.log(`✅ Customer ID: ${customerId}\n`);

    // Get all staff for this store
    const { data: allStaff, error: staffError } = await supabase
      .from('user_roles')
      .select('id, staff_code, role')
      .eq('store_id', storeId)
      .in('role', ['store_manager', 'staff']);

    if (staffError) {
      console.error('❌ Error fetching staff:', staffError.message);
      return;
    }

    const allStaffIds = new Set(allStaff?.map(s => s.id) || []);
    
    console.log(`👥 Total staff members: ${allStaffIds.size}`);
    allStaff?.forEach(s => console.log(`   - ${s.staff_code} (${s.role})`));
    console.log('');

    // Get all existing tasks
    const { data: existingTasks, error: existingError } = await supabase
      .from('checklist_tasks')
      .select('staff_id, template_id');

    if (existingError) {
      console.error('❌ Error fetching existing tasks:', existingError.message);
      return;
    }

    const staffByTemplate = {};
    existingTasks?.forEach(task => {
      if (!staffByTemplate[task.template_id]) {
        staffByTemplate[task.template_id] = new Set();
      }
      staffByTemplate[task.template_id].add(task.staff_id);
    });

    // Get all templates
    const { data: templates, error: templatesError } = await supabase
      .from('checklist_templates')
      .select('id, name, is_active')
      .eq('store_id', storeId);

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError.message);
      return;
    }

    console.log(`📋 Found ${templates?.length || 0} templates\n`);

    // Get or create assignments for each template
    let tasksCreated = 0;

    for (const template of templates || []) {
      const currentStaff = staffByTemplate[template.id] || new Set();
      const missingStaffList = allStaff?.filter(s => !currentStaff.has(s.id)) || [];

      if (missingStaffList.length > 0 && template.is_active) {
        // Get or create assignment
        let { data: existingAssignment } = await supabase
          .from('checklist_assignments')
          .select('id')
          .eq('template_id', template.id)
          .eq('store_id', storeId)
          .limit(1)
          .single();

        let assignmentId = existingAssignment?.id;

        if (!assignmentId) {
          // Create new assignment
          const { data: newAssignment, error: assignError } = await supabase
            .from('checklist_assignments')
            .insert({
              template_id: template.id,
              customer_id: customerId,
              store_id: storeId,
              staff_ids: [],  // Will be populated with actual tasks
              is_active: true,
              created_by: customerId,
            })
            .select('id')
            .single();

          if (assignError) {
            console.error(`❌ Error creating assignment for "${template.name}":`, assignError.message);
            continue;
          }

          assignmentId = newAssignment?.id;
          console.log(`✨ Created new assignment for "${template.name}"`);
        }

        // Calculate due date
        const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        // Create tasks for missing staff
        const newTasks = missingStaffList.map(staff => ({
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
          console.error(`❌ Error creating tasks for "${template.name}":`, insertError.message);
        } else {
          console.log(`✅ "${template.name}": Added ${created?.length || 0} tasks`);
          missingStaffList.forEach(staff => {
            console.log(`      • ${staff.staff_code}`);
          });
          tasksCreated += created?.length || 0;
        }
      } else if (template.is_active) {
        console.log(`✅ "${template.name}": Already assigned to all staff`);
      }
    }

    console.log(`\n✨ Complete! Created ${tasksCreated} new tasks for staff members`);
    console.log('📱 Refresh the staff checklist to see the tasks!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixChecklistAssignmentsV2();
