# SUPABASE MIGRATION: STEP-BY-STEP EXECUTION GUIDE

**Important:** Do NOT skip any steps. Follow in exact order.

---

## 📅 Pre-Migration Checklist (Do This BEFORE Migration Day)

### Day -1: Preparation

- [ ] Read [SUPABASE_MIGRATION_PLAN.md](./SUPABASE_MIGRATION_PLAN.md) completely
- [ ] Read [ENV_VARIABLES_GUIDE.md](./ENV_VARIABLES_GUIDE.md)
- [ ] Backup Lovable Supabase database (export full dump)
- [ ] Document all current environment variables
- [ ] Create Supabase account for personal project (if not done)
- [ ] Inform team of migration window (suggest off-peak hours)
- [ ] Prepare communication for users (if applicable)
- [ ] Ensure you have access to Supabase dashboard
- [ ] Test Supabase CLI installation: `supabase --version`
- [ ] Test PostgreSQL tools: `psql --version`
- [ ] Have all service keys ready in secure location

**Time Estimate:** 2-3 hours

---

## 🚀 MIGRATION DAY: STEP-BY-STEP EXECUTION

### PHASE 1: EXPORT FROM LOVABLE (Duration: ~1-2 hours)

#### Step 1.1: Get Lovable Service Role Key

```bash
# Go to Supabase Dashboard:
# URL: https://app.supabase.com/project/kqoveyroyhfbcdedyzop/settings/api

# Steps:
# 1. Click on Project: kqoveyroyhfbcdedyzop
# 2. Go to Settings → API
# 3. Under "Project API keys" section
# 4. Find "service_role" key (labeled as "Secret")
# 5. Click copy icon
# 6. Save securely as LOVABLE_SERVICE_KEY

# Test the key:
export LOVABLE_SERVICE_KEY="your_copied_service_key"
export LOVABLE_URL="https://kqoveyroyhfbcdedyzop.supabase.co"

# Verify (should not error)
curl -s "$LOVABLE_URL/rest/v1/schemas" \
  -H "Authorization: Bearer $LOVABLE_SERVICE_KEY" | head -20
```

**Output:** Should show JSON schema data (not 401 error)

#### Step 1.2: Export Database Schema

```bash
# Using Supabase CLI (RECOMMENDED)
supabase db pull --project-ref kqoveyroyhfbcdedyzop

# This creates/updates: supabase/migrations/

# OR using direct psql export
# First, get database password from dashboard:
# Settings → Database → Connection string
# Extract password from: postgresql://postgres:[PASSWORD]@db.kqoveyroyhfbcdedyzop.supabase.co:5432/postgres

export LOVABLE_DB_PASSWORD="your_password_here"
export LOVABLE_DB_HOST="db.kqoveyroyhfbcdedyzop.supabase.co"

pg_dump \
  -h "$LOVABLE_DB_HOST" \
  -U postgres \
  -d postgres \
  --no-password \
  -Fc \
  > lovable_full_dump.backup

# (Password will be prompted)
```

**Output:** `lovable_full_dump.backup` file created

#### Step 1.3: Export User List

```bash
# Create CSV of all auth users (for reference)
psql \
  -h db.kqoveyroyhfbcdedyzop.supabase.co \
  -U postgres \
  -d postgres \
  -c "COPY (SELECT id, email, created_at, email_confirmed_at FROM auth.users ORDER BY created_at) TO STDOUT WITH CSV HEADER" \
  > lovable_auth_users.csv

# Check result
head -20 lovable_auth_users.csv
wc -l lovable_auth_users.csv  # Count users
```

**Output:** CSV file with all user emails

#### Step 1.4: Export All Table Data

```bash
# Create backup directory
mkdir -p lovable_backup
cd lovable_backup

# Export all tables using migration script
chmod +x ../supabase_migrate_data.sh

# Create export script
cat > export_from_lovable.sh << 'EOF'
#!/bin/bash
export PGPASSWORD="$LOVABLE_DB_PASSWORD"
LOVABLE_HOST="db.kqoveyroyhfbcdedyzop.supabase.co"

TABLES=(
  "customers" "stores" "bills" "bill_items" 
  "inventory_items" "expenses" "staff" "payments"
  "store_settings" "store_items" "store_categories"
  # ... add all tables
)

for table in "${TABLES[@]}"; do
  echo "Exporting: $table"
  psql -h "$LOVABLE_HOST" -U postgres -d postgres \
    -c "\COPY public.$table TO STDOUT WITH CSV HEADER" \
    > "${table}.csv"
done

echo "Export complete!"
EOF

chmod +x export_from_lovable.sh
./export_from_lovable.sh

# Verify exports
ls -lh *.csv | head -10
```

**Output:** Multiple CSV files in `lovable_backup/` directory

#### Step 1.5: Export Edge Functions

```bash
# Copy all edge functions
mkdir -p lovable_functions_backup
cp -r supabase/functions/* lovable_functions_backup/

# List functions
ls -la lovable_functions_backup/

# Verify each function has index.ts
for func in lovable_functions_backup/*/; do
  if [ ! -f "$func/index.ts" ]; then
    echo "WARNING: $func missing index.ts"
  fi
done
```

**Output:** All functions backed up in `lovable_functions_backup/`

#### Step 1.6: Verify All Exports

```bash
# Check total size
du -sh lovable_backup/
du -sh lovable_functions_backup/

# Count CSVs
ls -1 lovable_backup/*.csv | wc -l

# Verify structure
head -1 lovable_backup/customers.csv
head -1 lovable_backup/stores.csv
head -1 lovable_backup/bills.csv
```

**Output:** Confirm all exports are present and not empty

---

### PHASE 2: CREATE PERSONAL SUPABASE PROJECT (Duration: ~15-20 minutes + 5-10 min wait)

#### Step 2.1: Create New Project

```bash
# Go to: https://supabase.com/dashboard

# Steps:
# 1. Click "New Project"
# 2. Organization: Select your organization
# 3. Project name: "paystore-pos" (or your name)
# 4. Database password: Create STRONG password (min 16 chars)
# 5. Region: Select closest to users (India if applicable)
# 6. Click "Create new project"
# 7. WAIT 5-10 minutes

# Save these details:
NEW_PROJECT_ID="[copy from project URL]"
NEW_DB_PASSWORD="[your password]"
NEW_PROJECT_URL="https://${NEW_PROJECT_ID}.supabase.co"
```

**Output:** New project created and initializing

#### Step 2.2: Wait for Database Initialization

```bash
# Monitor initialization
while true; do
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    "https://${NEW_PROJECT_ID}.supabase.co/rest/v1/")
  
  echo "Status: $status"
  
  if [ "$status" = "404" ] || [ "$status" = "200" ]; then
    echo "✓ Database is ready!"
    break
  fi
  
  echo "Waiting... (checking again in 10 seconds)"
  sleep 10
done
```

**Output:** Status code 200 or 404 (both mean it's ready)

#### Step 2.3: Get New Project Keys

```bash
# Go to: https://app.supabase.com/project/[NEW_PROJECT_ID]/settings/api

# Copy these keys:
# 1. Project URL (extract NEW_PROJECT_ID)
# 2. anon/public key → NEW_ANON_KEY
# 3. service_role (secret) → NEW_SERVICE_KEY

# Store in variables
export NEW_PROJECT_ID="[your_new_id]"
export NEW_ANON_KEY="[paste_anon_key]"
export NEW_SERVICE_KEY="[paste_service_key]"
export NEW_URL="https://${NEW_PROJECT_ID}.supabase.co"
export NEW_DB_PASSWORD="[your_password]"

# Verify keys
echo "Project ID: $NEW_PROJECT_ID"
echo "URL: $NEW_URL"
echo "Keys received: ✓"
```

**Output:** All environment variables set

#### Step 2.4: Test Connection

```bash
# Test if database is accessible
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -c "SELECT version();"

# Will prompt for password - enter NEW_DB_PASSWORD
```

**Output:** PostgreSQL version (confirms connection works)

---

### PHASE 3: DEPLOY SCHEMA TO NEW PROJECT (Duration: ~30 minutes)

#### Step 3.1: Link New Project to Local CLI

```bash
# In project root directory
cd paystore-pos-main

# Link to new project
supabase link --project-ref "$NEW_PROJECT_ID"

# When prompted for password, enter NEW_DB_PASSWORD
```

**Output:** Project linked to CLI

#### Step 3.2: Push All Migrations

```bash
# Deploy all migrations to new project
supabase db push --project-ref "$NEW_PROJECT_ID" --skip-foreign-key-violations

# This will:
# 1. Run all migration files in order
# 2. Create all tables
# 3. Create all functions
# 4. Create all triggers
# 5. Set up all RLS policies

# Monitor output for errors
```

**Output:** All migrations executed successfully

#### Step 3.3: Verify Schema Was Created

```bash
# Run verification queries
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

# Should show same count as Lovable

# Check functions
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');"

# Check triggers
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public';"
```

**Output:** Row counts match expected values

---

### PHASE 4: MIGRATE APPLICATION DATA (Duration: ~1-2 hours)

#### Step 4.1: Run Data Migration Script

```bash
# Make script executable
chmod +x supabase_migrate_data.sh

# Run migration
./supabase_migrate_data.sh "$NEW_PROJECT_ID"

# The script will prompt for:
# 1. Lovable Supabase password
# 2. New Personal Supabase password

# This script will:
# 1. Export all data from Lovable
# 2. Import all data to Personal
# 3. Verify row counts match
# 4. Re-enable triggers
```

**Output:** "Migration complete! Ready to update environment variables."

#### Step 4.2: Verify Data Counts

```bash
# Compare specific tables
for table in customers stores bills inventory_items; do
  lovable_count=$(psql \
    -h "db.kqoveyroyhfbcdedyzop.supabase.co" \
    -U postgres \
    -d postgres \
    -t -c "SELECT COUNT(*) FROM $table;")
  
  personal_count=$(psql \
    -h "db.${NEW_PROJECT_ID}.supabase.co" \
    -U postgres \
    -d postgres \
    -t -c "SELECT COUNT(*) FROM $table;")
  
  echo "$table: Lovable=$lovable_count, Personal=$personal_count"
done
```

**Output:** All counts should match

#### Step 4.3: Check Data Integrity

```bash
# Run verification queries
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -f verify_migration.sql

# Review output for any warnings or errors
```

**Output:** Verification report generated

---

### PHASE 5: MIGRATE AUTHENTICATION USERS (Duration: ~30 minutes)

#### Step 5.1: Run Auth User Migration

```bash
# Make sure Node.js dependencies are installed
npm install

# Compile TypeScript
npx tsc migrate-auth-users.ts --target ES2020 --module commonjs

# Run migration script
node migrate-auth-users.js

# When prompted:
# 1. Lovable Supabase URL: https://kqoveyroyhfbcdedyzop.supabase.co
# 2. Lovable Service Role Key: [paste LOVABLE_SERVICE_KEY]
# 3. Personal Supabase URL: https://${NEW_PROJECT_ID}.supabase.co
# 4. Personal Service Role Key: [paste NEW_SERVICE_KEY]
# 5. Strategy: (1) magic-link, (2) temp-password, or (3) manual
#    → Recommended: (2) temp-password for fastest migration

# Review the first 5 users listed
# Type "yes" to confirm
```

**Output:** 
- `auth_migration.log` - Detailed log of all operations
- `auth_migration_report_YYYY-MM-DD.txt` - Summary report

#### Step 5.2: Verify Auth Users

```bash
# Count users in new project
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) as user_count FROM auth.users;"

# Should match Lovable count

# Check user_roles
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -c "SELECT role, COUNT(*) FROM public.user_roles GROUP BY role;"
```

**Output:** User counts and role distribution

---

### PHASE 6: UPDATE ENVIRONMENT VARIABLES (Duration: ~10 minutes)

#### Step 6.1: Backup Current Environment

```bash
# Backup old .env
cp .env .env.lovable.backup
cp .env .env.migration.backup

echo "✓ Backup created: .env.lovable.backup"
```

#### Step 6.2: Update .env File

```bash
# Edit .env file with new values
cat > .env << EOF
SUPABASE_URL="https://${NEW_PROJECT_ID}.supabase.co"
SUPABASE_PUBLISHABLE_KEY="${NEW_ANON_KEY}"
VITE_SUPABASE_PROJECT_ID="${NEW_PROJECT_ID}"
VITE_SUPABASE_PUBLISHABLE_KEY="${NEW_ANON_KEY}"
VITE_SUPABASE_URL="https://${NEW_PROJECT_ID}.supabase.co"
EOF

# Verify
cat .env | grep supabase.co
```

**Output:** New environment variables saved

#### Step 6.3: Update config.toml

```bash
# Edit supabase/config.toml
# Change first line to:
sed -i "s/project_id = \"kqoveyroyhfbcdedyzop\"/project_id = \"${NEW_PROJECT_ID}\"/g" supabase/config.toml

# Verify
head -1 supabase/config.toml
```

**Output:** `project_id = "[NEW_PROJECT_ID]"`

#### Step 6.4: Set Edge Function Secrets

```bash
# Set OPENAI_API_KEY (if you have it)
read -sp "Enter OPENAI_API_KEY (or press Enter to skip): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
  supabase secrets set OPENAI_API_KEY="$OPENAI_KEY" \
    --project-ref "$NEW_PROJECT_ID"
fi

# Set LOVABLE_API_KEY (if you have it)
read -sp "Enter LOVABLE_API_KEY (or press Enter to skip): " LOVABLE_KEY
if [ ! -z "$LOVABLE_KEY" ]; then
  supabase secrets set LOVABLE_API_KEY="$LOVABLE_KEY" \
    --project-ref "$NEW_PROJECT_ID"
fi

# Set Supabase secrets
supabase secrets set \
  SUPABASE_URL="https://${NEW_PROJECT_ID}.supabase.co" \
  --project-ref "$NEW_PROJECT_ID"

supabase secrets set \
  SUPABASE_ANON_KEY="${NEW_ANON_KEY}" \
  --project-ref "$NEW_PROJECT_ID"

supabase secrets set \
  SUPABASE_SERVICE_ROLE_KEY="${NEW_SERVICE_KEY}" \
  --project-ref "$NEW_PROJECT_ID"

echo "✓ Secrets configured"
```

**Output:** Secrets set successfully

---

### PHASE 7: DEPLOY EDGE FUNCTIONS (Duration: ~10 minutes)

#### Step 7.1: Deploy All Functions

```bash
# Deploy all edge functions
supabase functions deploy --project-ref "$NEW_PROJECT_ID"

# Or deploy individually
for func_dir in supabase/functions/*/; do
  func_name=$(basename "$func_dir")
  echo "Deploying: $func_name"
  supabase functions deploy "$func_name" --project-ref "$NEW_PROJECT_ID"
done
```

**Output:** All functions deployed successfully

#### Step 7.2: Test One Function

```bash
# Test chat-assistant function
curl -X POST "https://${NEW_PROJECT_ID}.supabase.co/functions/v1/chat-assistant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${NEW_ANON_KEY}" \
  -d '{
    "messages": [{"role": "user", "content": "hello"}],
    "store_code": "TEST",
    "store_id": "test-id"
  }' \
  2>&1 | head -50

# Should get a response (may have auth error, that's ok for now)
```

**Output:** Function response (some error is normal, means function is deployed)

---

### PHASE 8: BUILD AND TEST FRONTEND (Duration: ~20 minutes)

#### Step 8.1: Clear Build Cache

```bash
# Remove old build artifacts
rm -rf dist
rm -rf node_modules/.vite
rm -rf node_modules/.cache

echo "✓ Build cache cleared"
```

#### Step 8.2: Rebuild Application

```bash
# Install dependencies (should be fast)
npm ci

# Build application
npm run build

# Should complete without errors

echo "✓ Build successful"
```

**Output:** Build completes successfully (check for errors)

#### Step 8.3: Test in Development Mode

```bash
# Start development server
npm run dev

# Output will show:
# VITE v... ready in ... ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help

# Keep running, open browser in new terminal
```

**Output:** Dev server running on localhost:5173

#### Step 8.4: Test Login (New Terminal)

```bash
# Open browser to http://localhost:5173/login

# In Browser DevTools (F12):
# 1. Go to Network tab
# 2. Check if requests go to NEW_PROJECT_ID (not kqoveyroyhfbcdedyzop)
# 3. Try login with test user email

# Look for:
# ✓ No 401 errors
# ✓ No CORS errors
# ✓ New project ID in URLs
# ✓ User data loads after login
```

**Output:** Login works, user can see their data

#### Step 8.5: Test Core Features

```bash
# After login, test these flows:

# 1. Create a new bill
#    Click: New Bill → verify it creates

# 2. View inventory
#    Click: Inventory → verify items load

# 3. Create order
#    Add items to bill → verify calculations work

# 4. View reports
#    Click: Reports → verify data shows

# 5. Check settings
#    Click: Settings → verify accessible

# 6. Test logout
#    Click: Logout → verify redirects to login
```

**Output:** All features working correctly

#### Step 8.6: Stop Development Server

```bash
# In dev server terminal:
# Press Ctrl+C to stop

echo "✓ Testing complete"
```

---

### PHASE 9: VERIFY EVERYTHING (Duration: ~30 minutes)

#### Step 9.1: Run Comprehensive Verification

```bash
# Connect to personal project and run all verification queries
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -f verify_migration.sql

# Review output carefully for any warnings or failures
```

**Output:** Verification report with all checks

#### Step 9.2: Check RLS Policies

```bash
# Verify RLS policies exist
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public';"

# Should show >20 policies

# Test RLS by logging in as different users and checking data access
```

**Output:** Policies count and verification

#### Step 9.3: Monitor Logs

```bash
# Check for any errors in the last hour
supabase functions logs chat-assistant --project-ref "$NEW_PROJECT_ID" --tail

# Let it run for a minute, then Ctrl+C
```

**Output:** No errors in logs

---

### PHASE 10: FINAL DEPLOYMENT (Duration: ~5 minutes)

#### Step 10.1: Tag This Migration

```bash
# Tag the migration in git
git tag -a "migration-lovable-to-personal-$(date +%Y%m%d)" \
  -m "Migrated Supabase from Lovable ($OLD_PROJECT_ID) to Personal ($NEW_PROJECT_ID)"

git push origin "migration-lovable-to-personal-$(date +%Y%m%d)"

echo "✓ Migration tagged in git"
```

#### Step 10.2: Document Results

```bash
# Create migration summary
cat > MIGRATION_COMPLETED.md << EOF
# Supabase Migration Completed

**Date:** $(date)

**From:** Lovable Supabase (kqoveyroyhfbcdedyzop)
**To:** Personal Supabase ($NEW_PROJECT_ID)

## Verification Results
- Users: ✓
- Tables: ✓
- Functions: ✓
- Triggers: ✓
- RLS Policies: ✓
- Storage: ✓
- Edge Functions: ✓

## Environment Variables Updated
- .env: ✓
- config.toml: ✓
- secrets: ✓

## Testing Results
- Login: ✓
- Data Access: ✓
- Bill Creation: ✓
- Inventory: ✓
- Reports: ✓

## Next Steps
1. Monitor production for 48 hours
2. Keep Lovable backup for 7 days
3. Update DNS if applicable
4. Notify users of migration completion
5. Archive Lovable project

## Rollback Available
- Backup location: ./lovable_full_dump.backup
- Backup date: $(date)
- Lovable project: Still active (kqoveyroyhfbcdedyzop)
EOF

cat MIGRATION_COMPLETED.md
```

**Output:** Migration summary document created

#### Step 10.3: Notify Team

```bash
# Create notification template
cat > MIGRATION_NOTIFICATION.txt << EOF
✓ SUPABASE MIGRATION COMPLETE

We have successfully migrated PayStore POS from Lovable's Supabase project
to our own personal Supabase project.

**New Project ID:** $NEW_PROJECT_ID
**New URL:** $NEW_URL

**What's Changed:**
- Nothing visible to users
- Same features, same data
- Improved performance (in same region)
- Better cost control

**What You Need to Know:**
- Your password remains the same
- Your data is intact
- All your bills and history are there
- Session may be refreshed (automatic)

**If You Experience Issues:**
- Clear browser cache (Ctrl+Shift+Del)
- Log out and log back in
- Contact support

Migration Completed: $(date)
EOF

cat MIGRATION_NOTIFICATION.txt

# Send to users/team as needed
```

---

## 🎉 POST-MIGRATION: MONITORING (Duration: 48 hours)

### Hour 0-1: Immediate Verification

```bash
# Watch logs in real-time
supabase functions logs --project-ref "$NEW_PROJECT_ID" --tail &

# Open new browser windows and test all features
# - Login
# - Create bill
# - View inventory
# - Check reports
# - Test on mobile (if applicable)
```

### Hour 1-24: Background Monitoring

```bash
# Set up monitoring alerts
# Check these daily:

# 1. Error rate
supabase functions logs --project-ref "$NEW_PROJECT_ID"

# 2. Database performance
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -c "SELECT query, calls, total_time FROM pg_stat_statements LIMIT 10;"

# 3. Auth failures
supabase logs auth --project-ref "$NEW_PROJECT_ID"
```

### Hour 24-48: Final Verification

```bash
# Run verification script again
psql -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres \
  -d postgres \
  -f verify_migration.sql

# All checks should still pass
```

### Day 3+: Archive Old Project

```bash
# After 48 hours of successful operation:

# 1. Backup Lovable project one more time
pg_dump -h db.kqoveyroyhfbcdedyzop.supabase.co \
  -U postgres -d postgres \
  > lovable_final_backup_$(date +%Y%m%d).backup

# 2. Consider decommissioning Lovable project
# (Keep accessible for 7 days for emergency rollback)

# 3. Archive migration logs
tar czf supabase_migration_logs_$(date +%Y%m%d).tar.gz \
  *.log *.csv MIGRATION_COMPLETED.md lovable_auth_users.csv

# 4. Securely delete sensitive files
# rm -f .env.lovable.backup
# rm -f lovable_auth_users.csv (after archiving)
```

---

## ❌ ROLLBACK PROCEDURE (If Needed)

If something goes wrong:

### Immediate Rollback (First 1 Hour)

```bash
# 1. Revert environment variables
cp .env.lovable.backup .env

# 2. Clear cache
rm -rf dist node_modules/.vite

# 3. Rebuild with old environment
npm ci && npm run build

# 4. Restart app
# Users will automatically reconnect to Lovable

# 5. Notify users
# "Migration rolled back, using previous system"
```

### Full Database Rollback (1-24 Hours)

```bash
# 1. Stop all applications

# 2. Restore Lovable from backup
psql -h db.kqoveyroyhfbcdedyzop.supabase.co \
  -U postgres \
  -d postgres \
  < lovable_full_dump.backup

# 3. Verify data is restored
psql -h db.kqoveyroyhfbcdedyzop.supabase.co \
  -U postgres \
  -d postgres \
  -c "SELECT COUNT(*) FROM public.bills;"

# 4. Revert .env to Lovable values
cp .env.lovable.backup .env

# 5. Rebuild and restart
npm ci && npm run build && npm run dev
```

### Complete Decommission (After 7 Days)

```bash
# 1. Final backup of new project
pg_dump -h "db.${NEW_PROJECT_ID}.supabase.co" \
  -U postgres -d postgres \
  > personal_supabase_final_backup_$(date +%Y%m%d).backup

# 2. Archive all migration files
tar czf supabase_migration_complete_$(date +%Y%m%d).tar.gz \
  lovable_full_dump.backup \
  lovable_functions_backup \
  lovable_backup \
  MIGRATION_COMPLETED.md

# 3. Securely delete temporary files
# rm -rf lovable_functions_backup
# rm -rf lovable_backup
# rm -f *.csv

echo "✓ Migration complete and archived"
```

---

## 📊 SUCCESS CRITERIA

Migration is successful when:

✅ All users can login  
✅ All user data is accessible  
✅ No console errors  
✅ No auth errors  
✅ No database errors  
✅ All features work  
✅ All reports display correctly  
✅ Edge functions responsive  
✅ Storage files accessible  
✅ Realtime subscriptions work  
✅ No performance degradation  
✅ 48 hours without issues  

---

## 📞 EMERGENCY SUPPORT

If you encounter critical issues:

1. **Check:** supabase_migrate_data.log, auth_migration.log
2. **Review:** Error messages in browser console
3. **Contact:** Supabase support (provide project ID)
4. **Rollback:** Follow rollback procedure immediately

---

**MIGRATION READY!** Execute in order. Good luck! 🚀
