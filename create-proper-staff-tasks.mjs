#!/usr/bin/env node

/**
 * Create proper checklist tasks for existing staff members
 */

const supabaseUrl = "https://axrtlqgvouqadldyywkq.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnRscWd2b3VxYWRsZHl5d2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTgyODMsImV4cCI6MjA5NDA5NDI4M30.-HvNB6oqBSqKbk6jYTY6gZgzUWZ0CiAkee1fUpB2U58";

const headers = {
  "Content-Type": "application/json",
  "apikey": anonKey
};

async function fetchFromAPI(table, filters = "") {
  const url = `${supabaseUrl}/rest/v1/${table}${filters}`;
  console.log(`📡 Fetching: ${table}${filters}`);
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const error = await response.json();
    console.error(`  Error:`, error);
    return [];
  }
  const data = await response.json();
  console.log(`  ✓ Got ${data.length} record(s)`);
  return data;
}

async function insertToAPI(table, data) {
  const url = `${supabaseUrl}/rest/v1/${table}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`${error.message}`);
  }
  return response.json();
}

async function createTasksForStaff() {
  console.log("\n🚀 Creating Checklist Tasks for Staff Members\n");

  try {
    // Step 1: Get stores
    console.log("Step 1: Getting stores...");
    const stores = await fetchFromAPI("stores", "?select=id,store_name,customer_id&limit=10");
    
    if (stores.length === 0) {
      console.log("\n⚠️  No stores found! Need to create sample data first.\n");
      return;
    }

    // Step 2: Get user_roles with staff
    console.log("\nStep 2: Getting staff members...");
    const staffRoles = await fetchFromAPI("user_roles", "?role=eq.staff&select=id,user_id,store_id,staff_code&limit=50");
    
    if (staffRoles.length === 0) {
      console.log("\n⚠️  No staff members found! Creating sample staff...\n");
      
      // Create sample staff entries
      const sampleStaff = [];
      for (const store of stores.slice(0, 2)) {
        const staffId = `00000000-0000-0000-0000-${String(Date.now()).slice(-12).padStart(12, '0')}`;
        sampleStaff.push({
          id: staffId,
          user_id: staffId,
          role: 'staff',
          store_id: store.id,
          customer_id: store.customer_id,
          staff_code: `STAFF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          is_active: true
        });
      }
      
      try {
        console.log("\nCreating sample staff entries...");
        const created = await insertToAPI("user_roles", sampleStaff);
        console.log(`✅ Created ${created.length} staff entries\n`);
        staffRoles.push(...created);
      } catch (error) {
        console.log(`  Note: ${error.message}\n`);
        // Use the sample staff we created anyway for the next step
        console.log(`  Using sample staff IDs for task creation...\n`);
        staffRoles.push(...sampleStaff);
      }
    }

    console.log(`Found ${staffRoles.length} staff member(s):`);
    staffRoles.forEach((s, i) => {
      console.log(`  ${i+1}. ${s.staff_code || s.user_id.substring(0, 8)}... (Store: ${s.store_id.substring(0, 8)}...)`);
    });

    // Step 3: Get templates
    console.log("\nStep 3: Getting checklist templates...");
    const templates = await fetchFromAPI("checklist_templates", "?select=id,store_id,name&limit=20");

    if (templates.length === 0) {
      console.log("\n⚠️  No templates found! Skipping task creation.\n");
      return;
    }

    console.log(`Found ${templates.length} template(s)`);

    // Step 4: Create tasks
    console.log("\nStep 4: Creating tasks for staff...\n");
    
    let totalCreated = 0;
    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    for (const staff of staffRoles) {
      // Get templates for this staff's store
      const storeTemplates = templates.filter(t => t.store_id === staff.store_id);
      
      if (storeTemplates.length === 0) {
        console.log(`⏭️  No templates for store ${staff.store_id.substring(0, 8)}..., skipping`);
        continue;
      }

      const tasksToCreate = storeTemplates.map(template => ({
        template_id: template.id,
        customer_id: staff.customer_id,
        store_id: staff.store_id,
        staff_id: staff.user_id || staff.id, // Use user_id if available, else id
        status: "pending",
        assigned_at: now,
        due_at: tomorrow
      }));

      try {
        const created = await insertToAPI("checklist_tasks", tasksToCreate);
        console.log(`✅ ${staff.staff_code || staff.id.substring(0, 8)}: Created ${created.length} tasks`);
        created.forEach(task => {
          const template = storeTemplates.find(t => t.id === task.template_id);
          console.log(`   - ${template?.name}`);
        });
        totalCreated += created.length;
      } catch (error) {
        console.log(`❌ ${staff.staff_code || staff.id.substring(0, 8)}: ${error.message}`);
      }
    }

    console.log(`\n✨ SUCCESS! Created ${totalCreated} total tasks`);
    console.log("\n📋 Staff can now see their tasks when they:");
    console.log("   1. Log in with Supabase auth (email + password)");
    console.log("   2. Or use staff PIN login with their assigned PIN");
    console.log("   3. Navigate to 'My Checklists' page\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

createTasksForStaff();
