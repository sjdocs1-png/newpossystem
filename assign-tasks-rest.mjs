#!/usr/bin/env node

const supabaseUrl = "https://axrtlqgvouqadldyywkq.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnRscWd2b3VxYWRsZHl5d2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTgyODMsImV4cCI6MjA5NDA5NDI4M30.-HvNB6oqBSqKbk6jYTY6gZgzUWZ0CiAkee1fUpB2U58";

const headers = {
  "Content-Type": "application/json",
  "apikey": anonKey,
  "Authorization": `Bearer ${anonKey}`
};

async function fetchFromAPI(table, filters = "") {
  const url = `${supabaseUrl}/rest/v1/${table}${filters}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${table}: ${response.statusText}`);
  }
  return response.json();
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
    throw new Error(`Failed to insert into ${table}: ${JSON.stringify(error)}`);
  }
  return response.json();
}

async function assignTasks() {
  console.log("🚀 Creating Checklist Tasks for Staff Members...\n");

  try {
    // Fetch staff members
    console.log("📥 Fetching staff members...");
    const staff = await fetchFromAPI("user_roles", "?role=eq.staff&select=id,user_id,store_id");
    console.log(`✅ Found ${staff.length} staff members\n`);
    
    if (staff.length === 0) {
      console.log("⚠️  No staff members found!");
      return;
    }

    staff.forEach(s => {
      console.log(`  - ${s.id.substring(0, 12)}... (store: ${s.store_id?.substring(0, 12)}...)`);
    });

    // Fetch templates
    console.log("\n📥 Fetching checklist templates...");
    const templates = await fetchFromAPI("checklist_templates", "?select=id,name,store_id,checklist_type");
    console.log(`✅ Found ${templates.length} templates\n`);
    
    if (templates.length === 0) {
      console.log("⚠️  No templates found!");
      return;
    }

    templates.forEach(t => {
      console.log(`  - ${t.name} (${t.checklist_type})`);
    });

    // Create tasks
    console.log("\n📝 Creating tasks...");
    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const tasksToCreate = [];
    for (const s of staff) {
      for (const t of templates) {
        if (s.store_id === t.store_id) {
          tasksToCreate.push({
            staff_id: s.id,
            store_id: s.store_id,
            template_id: t.id,
            status: "pending",
            assigned_at: now,
            due_at: tomorrow
          });
        }
      }
    }

    console.log(`Creating ${tasksToCreate.length} tasks...`);

    // Insert in batches to avoid timeouts
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < tasksToCreate.length; i += batchSize) {
      const batch = tasksToCreate.slice(i, i + batchSize);
      try {
        const result = await insertToAPI("checklist_tasks", batch);
        inserted += batch.length;
        console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} tasks)`);
      } catch (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
      }
    }

    console.log(`\n✨ SUCCESS! Created ${inserted} checklist tasks`);
    console.log("Staff members should now see tasks in their 'My Checklists' page 🎉\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

assignTasks();
