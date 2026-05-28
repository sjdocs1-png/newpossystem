import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://axrtlqgvouqadldyywkq.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable not found');
  console.log('Using anon key for API access only...');
}

const supabase = createClient(supabaseUrl, serviceRoleKey || process.env.VITE_SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

async function assignTasksToStaff() {
  console.log('🚀 Creating and Assigning Checklist Tasks to Staff Members...\n');

  try {
    // Step 1: Get all staff members
    console.log('Step 1: Fetching staff members...');
    const { data: staffList, error: staffError } = await supabase
      .from('user_roles')
      .select('id, user_id, store_id, role')
      .eq('role', 'staff');

    if (staffError) {
      console.error('❌ Error fetching staff:', staffError);
      return;
    }

    console.log(`✅ Found ${staffList.length} staff member(s)\n`);
    staffList.forEach(s => {
      console.log(`  - Staff ID: ${s.id.substring(0, 8)}... (User: ${s.user_id?.substring(0, 8)}...)`);
    });

    if (staffList.length === 0) {
      console.log('⚠️  No staff members found. Please add staff first.');
      return;
    }

    // Step 2: Get checklist templates
    console.log('\nStep 2: Fetching checklist templates...');
    const { data: templates, error: templateError } = await supabase
      .from('checklist_templates')
      .select('id, name, store_id, checklist_type')
      .limit(10);

    if (templateError) {
      console.error('❌ Error fetching templates:', templateError);
      return;
    }

    console.log(`✅ Found ${templates.length} template(s)\n`);
    templates.forEach(t => {
      console.log(`  - ${t.name} (${t.checklist_type})`);
    });

    if (templates.length === 0) {
      console.log('⚠️  No templates found. Creating default templates...');
      // Create default templates if none exist
      const defaultTemplates = [
        {
          name: 'Opening Checklist',
          description: 'Complete all opening procedures',
          checklist_type: 'opening',
          instructions: 'Verify all opening tasks'
        },
        {
          name: 'Closing Checklist',
          description: 'Complete all closing procedures',
          checklist_type: 'closing',
          instructions: 'Verify all closing tasks'
        },
        {
          name: 'Hygiene Check',
          description: 'Personal hygiene verification',
          checklist_type: 'hygiene',
          instructions: 'Verify hygiene standards'
        },
      ];

      for (const template of defaultTemplates) {
        const store = staffList[0]?.store_id;
        const { data: newTemplate, error: createError } = await supabase
          .from('checklist_templates')
          .insert({ ...template, store_id: store })
          .select();

        if (createError) {
          console.error(`❌ Error creating template ${template.name}:`, createError);
        } else {
          console.log(`✅ Created: ${template.name}`);
          templates.push(...newTemplate);
        }
      }
    }

    // Step 3: Create tasks and assign to each staff
    console.log('\nStep 3: Creating and assigning tasks...\n');
    let totalTasksCreated = 0;

    for (const staff of staffList) {
      console.log(`\n👤 Assigning tasks to staff ${staff.id.substring(0, 8)}...`);
      
      const tasksToCreate = templates.map(template => ({
        staff_id: staff.id,
        store_id: staff.store_id,
        template_id: template.id,
        status: 'pending',
        assigned_at: new Date().toISOString(),
        due_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Due tomorrow
      }));

      const { data: createdTasks, error: taskError } = await supabase
        .from('checklist_tasks')
        .insert(tasksToCreate)
        .select();

      if (taskError) {
        console.error(`❌ Error creating tasks for staff:`, taskError);
      } else {
        console.log(`  ✅ Created ${createdTasks.length} tasks`);
        totalTasksCreated += createdTasks.length;
        
        createdTasks.forEach(task => {
          const template = templates.find(t => t.id === task.template_id);
          console.log(`     - ${template?.name}`);
        });
      }
    }

    console.log(`\n\n✨ SUCCESS! Created ${totalTasksCreated} total checklist tasks`);
    console.log('Staff members should now see tasks in their "My Checklists" page 🎉\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

assignTasksToStaff();
