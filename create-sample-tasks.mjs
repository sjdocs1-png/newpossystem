#!/usr/bin/env node

/**
 * Create sample checklist tasks for localStorage-based staff login
 * This script:
 * 1. Gets the logged-in staff from localStorage
 * 2. Gets the store info
 * 3. Fetches available templates
 * 4. Creates tasks for the staff member
 */

import crypto from 'crypto';

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

async function createSampleTasks() {
  console.log("🚀 Creating Sample Checklist Tasks...\n");

  try {
    // Step 1: Get all stores (assuming staff is from a store)
    console.log("📥 Fetching stores...");
    const stores = await fetchFromAPI("stores", "?limit=5&select=id,store_name,customer_id");
    console.log(`✅ Found ${stores.length} store(s)\n`);

    if (stores.length === 0) {
      console.log("⚠️  No stores found!");
      return;
    }

    const store = stores[0];
    console.log(`Using store: ${store.store_name} (${store.id.substring(0, 12)}...)\n`);

    // Step 2: Get or create a sample staff member
    console.log("📝 Creating sample staff member...");
    const sampleStaff = {
      id: crypto.randomUUID(),
      store_id: store.id,
      name: "Sample Staff",
      email: "staff@example.com",
      phone: "1234567890",
      role: "waiter",
      status: "active",
      hire_date: new Date().toISOString().split('T')[0]
    };

    // For now, we'll use a UUID for the staff_id in tasks
    console.log(`Staff ID: ${sampleStaff.id.substring(0, 12)}...\n`);

    // Step 3: Fetch or create templates
    console.log("📥 Fetching checklist templates...");
    const templates = await fetchFromAPI("checklist_templates", "?limit=10&select=id,name,store_id");
    console.log(`✅ Found ${templates.length} template(s)\n`);

    if (templates.length === 0) {
      console.log("⚠️  No templates found! Creating default templates...\n");
      
      const defaultTemplates = [
        {
          store_id: store.id,
          name: "Opening Checklist",
          description: "Complete opening procedures",
          checklist_type: "opening",
          instructions: "Verify all opening tasks are completed"
        },
        {
          store_id: store.id,
          name: "Closing Checklist",
          description: "Complete closing procedures",
          checklist_type: "closing",
          instructions: "Verify all closing tasks are completed"
        },
        {
          store_id: store.id,
          name: "Hygiene Check",
          description: "Personal hygiene verification",
          checklist_type: "hygiene",
          instructions: "Verify hygiene standards"
        }
      ];

      for (const template of defaultTemplates) {
        try {
          const result = await insertToAPI("checklist_templates", template);
          templates.push(...result);
          console.log(`✅ Created: ${template.name}`);
        } catch (error) {
          console.error(`❌ Error creating ${template.name}:`, error.message);
        }
      }
      console.log();
    }

    // Step 4: Create tasks for the staff member
    console.log(`📝 Creating ${templates.length} tasks for staff...\n`);
    const now = new Date().toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const tasksToCreate = templates.map(template => ({
      staff_id: sampleStaff.id,
      store_id: store.id,
      template_id: template.id,
      status: "pending",
      assigned_at: now,
      due_at: tomorrow,
      priority: "medium"
    }));

    const createdTasks = await insertToAPI("checklist_tasks", tasksToCreate);
    console.log(`✅ Created ${createdTasks.length} tasks\n`);

    createdTasks.forEach(task => {
      const template = templates.find(t => t.id === task.template_id);
      console.log(`  ✓ ${template?.name}`);
    });

    console.log(`\n✨ SUCCESS! Created ${createdTasks.length} checklist tasks`);
    console.log(`\nStaff ID to use for testing:`);
    console.log(`  ${sampleStaff.id}\n`);
    console.log("Store localStorage data:");
    console.log(`  {
    "id": "${sampleStaff.id}",
    "store_id": "${store.id}",
    "name": "${sampleStaff.name}",
    "email": "${sampleStaff.email}",
    "role": "${sampleStaff.role}"
  }\n`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createSampleTasks();
