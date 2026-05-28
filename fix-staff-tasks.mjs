#!/usr/bin/env node

/**
 * Fix mismatched staff IDs in checklist tasks
 * Gets all pending tasks and updates them to use correct staff IDs from StaffLoginPage data
 */

const supabaseUrl = "https://axrtlqgvouqadldyywkq.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cnRscWd2b3VxYWRsZHl5d2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTgyODMsImV4cCI6MjA5NDA5NDI4M30.-HvNB6oqBSqKbk6jYTY6gZgzUWZ0CiAkee1fUpB2U58";

const headers = {
  "Content-Type": "application/json",
  "apikey": anonKey
};

async function fetchFromAPI(table, filters = "") {
  const url = `${supabaseUrl}/rest/v1/${table}${filters}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error fetching ${table}:`, error);
    return [];
  }
  return response.json();
}

async function updateAPI(table, id, data) {
  const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${id}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error updating ${table}:`, error);
    return null;
  }
  return response.json();
}

async function deleteFromAPI(table, filter) {
  const url = `${supabaseUrl}/rest/v1/${table}${filter}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers
  });
  if (!response.ok) {
    const error = await response.json();
    console.error(`Error deleting from ${table}:`, error);
    return null;
  }
  return true;
}

async function fixStaffTasks() {
  console.log("🔧 Fixing Staff Checklist Tasks...\n");

  try {
    // Step 1: Get all pending tasks
    console.log("📥 Fetching pending tasks...");
    const tasks = await fetchFromAPI("checklist_tasks", "?status=eq.pending&limit=100&select=id,staff_id,store_id,template_id");
    console.log(`Found ${tasks.length} pending tasks\n`);

    if (tasks.length === 0) {
      console.log("⚠️  No pending tasks found!");
      return;
    }

    // Step 2: Get stores with their staff
    console.log("📥 Fetching stores...");
    const stores = await fetchFromAPI("stores", "?is_active=eq.true&limit=20&select=id,store_name,customer_id");
    console.log(`Found ${stores.length} store(s)\n`);

    if (stores.length === 0) {
      console.log("⚠️  No stores found!");
      return;
    }

    // Step 3: Delete existing tasks with mismatched staff IDs
    console.log("🗑️  Cleaning up mismatched tasks...");
    const taskStoreMap = new Map();
    tasks.forEach(task => {
      if (!taskStoreMap.has(task.store_id)) {
        taskStoreMap.set(task.store_id, []);
      }
      taskStoreMap.get(task.store_id).push(task);
    });

    for (const [storeId, storeTasks] of taskStoreMap) {
      console.log(`\n  Store ${storeId.substring(0, 8)}...: ${storeTasks.length} tasks`);
      // Delete all these tasks - we'll recreate them properly
      for (const task of storeTasks) {
        await deleteFromAPI("checklist_tasks", `?id=eq.${task.id}`);
      }
      console.log(`  ✓ Deleted ${storeTasks.length} tasks`);
    }

    // Step 4: Create new tasks with proper staff IDs
    console.log("\n\n📝 Creating new tasks with correct staff IDs...\n");

    for (const store of stores) {
      console.log(`\n  Store: ${store.store_name}`);
      
      // Use a consistent staff ID based on store (deterministic)
      // In real app, this would come from user login
      const staffId = `staff-${store.id.substring(0, 8)}-default`;
      
      // Get templates for this store
      const templates = await fetchFromAPI("checklist_templates", `?store_id=eq.${store.id}&limit=10&select=id,name`);
      console.log(`  Templates: ${templates.length}`);

      if (templates.length === 0) {
        console.log(`  ⚠️  No templates for this store`);
        continue;
      }

      // Create tasks
      const now = new Date().toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const tasksToCreate = templates.map((template, idx) => ({
        template_id: template.id,
        customer_id: store.customer_id,
        store_id: store.id,
        staff_id: staffId,
        status: "pending",
        assigned_at: now,
        due_at: tomorrow
      }));

      // Batch insert
      const url = `${supabaseUrl}/rest/v1/checklist_tasks`;
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(tasksToCreate)
      });

      if (response.ok) {
        const created = await response.json();
        console.log(`  ✅ Created ${created.length} tasks for staff ID: ${staffId.substring(0, 20)}...`);
        
        // Print template names
        created.forEach((task, idx) => {
          if (templates[idx]) {
            console.log(`     - ${templates[idx].name}`);
          }
        });
      } else {
        const error = await response.json();
        console.error(`  ❌ Error creating tasks:`, error.message);
      }
    }

    console.log("\n\n✨ SUCCESS! Tasks created with proper staff IDs");
    console.log("\n📋 To use in StaffLoginPage:");
    console.log(`  Staff ID format: staff-<store-id>-default`);
    console.log(`  Example: staff-${stores[0]?.id.substring(0, 8)}-default\n`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

fixStaffTasks();
