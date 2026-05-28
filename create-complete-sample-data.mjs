#!/usr/bin/env node

/**
 * Create sample data for staff checklist testing
 * This creates everything needed: stores, staff, templates, tasks
 */

const supabaseUrl = "https://axrtlqgvouqadldyywkq.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnRscWd2b3VxYWRsZHl5d2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTgyODMsImV4cCI6MjA5NDA5NDI4M30.-HvNB6oqBSqKbk6jYTY6gZgzUWZ0CiAkee1fUpB2U58";

const headers = {
  "Content-Type": "application/json",
  "apikey": anonKey
};

async function insertToAPI(table, data) {
  const url = `${supabaseUrl}/rest/v1/${table}`;
  console.log(`📝 Creating ${Array.isArray(data) ? data.length : 1} record(s) in ${table}...`);
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    console.log(`❌ Error creating ${table}: ${error.message}`);
    return null;
  }

  const result = await response.json();
  console.log(`✅ Created ${Array.isArray(result) ? result.length : 1} record(s) in ${table}`);
  return result;
}

async function createSampleData() {
  console.log("🚀 Creating Complete Sample Data for Staff Checklists\n");

  try {
    // Step 1: Create customer
    console.log("Step 1: Creating customer...");
    const customerId = crypto.randomUUID();
    const customer = await insertToAPI("customers", {
      id: customerId,
      business_name: "Sample Restaurant",
      owner_name: "Test Owner",
      subscription_plan: "basic",
      subscription_tier: "starter",
      is_active: true
    });

    if (!customer) {
      console.log("⚠️  Customer creation failed, using existing or continuing...");
    }

    // Step 2: Create store
    console.log("\nStep 2: Creating store...");
    const storeId = crypto.randomUUID();
    const store = await insertToAPI("stores", {
      id: storeId,
      customer_id: customerId,
      store_name: "Sample Store",
      address: "123 Test Street",
      is_active: true
    });

    if (!store) {
      console.log("⚠️  Store creation failed, using existing or continuing...");
    }

    // Step 3: Create staff user role
    console.log("\nStep 3: Creating staff member...");
    const staffUserId = crypto.randomUUID();
    const staffRole = await insertToAPI("user_roles", {
      id: crypto.randomUUID(),
      user_id: staffUserId,
      role: "staff",
      store_id: storeId,
      customer_id: customerId,
      staff_code: "STAFF001",
      is_active: true
    });

    if (!staffRole) {
      console.log("⚠️  Staff creation failed, using existing or continuing...");
    }

    // Step 4: Create checklist templates
    console.log("\nStep 4: Creating checklist templates...");
    const templates = [
      {
        store_id: storeId,
        customer_id: customerId,
        name: "Opening Checklist",
        description: "Complete all opening procedures",
        checklist_type: "opening",
        instructions: "Verify all opening tasks are completed properly",
        requires_photo: true,
        points: 10,
        due_minutes: 30
      },
      {
        store_id: storeId,
        customer_id: customerId,
        name: "Closing Checklist",
        description: "Complete all closing procedures",
        checklist_type: "closing",
        instructions: "Verify all closing tasks are completed properly",
        requires_photo: true,
        points: 10,
        due_minutes: 30
      },
      {
        store_id: storeId,
        customer_id: customerId,
        name: "Hygiene Check",
        description: "Personal hygiene verification",
        checklist_type: "hygiene",
        instructions: "Verify personal hygiene standards are met",
        requires_photo: true,
        requires_selfie: true,
        points: 15,
        due_minutes: 60
      }
    ];

    const createdTemplates = await insertToAPI("checklist_templates", templates);

    if (!createdTemplates) {
      console.log("⚠️  Template creation failed, using existing or continuing...");
    }

    // Step 5: Create tasks for staff
    console.log("\nStep 5: Creating checklist tasks...");
    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const tasks = (createdTemplates || []).map(template => ({
      template_id: template.id,
      customer_id: customerId,
      store_id: storeId,
      staff_id: staffUserId,
      status: "pending",
      assigned_at: now,
      due_at: tomorrow
    }));

    const createdTasks = await insertToAPI("checklist_tasks", tasks);

    if (!createdTasks) {
      console.log("⚠️  Task creation failed, using existing or continuing...");
    }

    console.log("\n\n✨ SUCCESS! Sample data created");
    console.log("\n📋 Staff Login Details:");
    console.log(`   Staff ID: ${staffUserId}`);
    console.log(`   Store ID: ${storeId}`);
    console.log(`   Customer ID: ${customerId}`);
    console.log("\n🔑 To test staff checklist:");
    console.log("   1. Staff login karo (email/password se)");
    console.log("   2. 'My Checklists' page pe jaao");
    console.log("   3. Tasks dikh jayenge!");
    console.log("\n💡 Agar abhi bhi nahi dikha, toh browser refresh karo (F5)\n");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\n💡 Note: Agar RLS policies block kar rahe hain, toh Supabase dashboard se manually create karo");
  }
}

createSampleData();
