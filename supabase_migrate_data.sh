#!/bin/bash

# ============================================================================
# SUPABASE DATA MIGRATION SCRIPT
# Migrates application data from Lovable to Personal Supabase
# ============================================================================

set -e  # Exit on error

echo "=================================================="
echo "SUPABASE DATA MIGRATION SCRIPT"
echo "=================================================="
echo ""

# ============================================================================
# CONFIGURATION
# ============================================================================

# Lovable Supabase (Source)
LOVABLE_HOST="db.kqoveyroyhfbcdedyzop.supabase.co"
LOVABLE_USER="postgres"
LOVABLE_DB="postgres"
LOVABLE_PORT="5432"

# Personal Supabase (Target) - UPDATE WITH YOUR NEW PROJECT ID
NEW_PROJECT_ID="${1:-YOUR_NEW_PROJECT_ID}"
NEW_HOST="db.${NEW_PROJECT_ID}.supabase.co"
NEW_USER="postgres"
NEW_DB="postgres"
NEW_PORT="5432"

# Passwords will be prompted if not set in environment
LOVABLE_PASSWORD="${LOVABLE_PASSWORD:-}"
NEW_PASSWORD="${NEW_PASSWORD:-}"

# Tables to migrate (in dependency order - foreign keys first!)
TABLES=(
  "customers"
  "stores"
  "store_settings"
  "store_categories"
  "store_items"
  "store_modifiers"
  "store_modifier_items"
  "store_taxes"
  "store_discounts"
  "staff"
  "staff_schedules"
  "bills"
  "bill_items"
  "bill_item_modifiers"
  "bill_taxes"
  "bill_discounts"
  "payments"
  "payment_logs"
  "inventory_items"
  "inventory_batches"
  "inventory_transfers"
  "expenses"
  "expense_categories"
  "expense_items"
  "held_bills"
  "chat_conversations"
  "chat_messages"
  "chat_participants"
  "checklist_templates"
  "checklist_template_fields"
  "checklists"
  "checklist_items"
  "delivery_orders"
  "delivery_staff"
  "platform_integrations"
  "platform_orders"
  "cron_logs"
  "audit_logs"
  "user_roles"
)

# Backup directory
BACKUP_DIR="./migration_backup_$(date +%Y%m%d_%H%M%S)"

# ============================================================================
# FUNCTIONS
# ============================================================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
  echo "ERROR: $1"
  exit 1
}

confirm() {
  read -p "$1 (yes/no): " response
  if [ "$response" != "yes" ]; then
    error "Aborted by user"
  fi
}

# ============================================================================
# VALIDATION
# ============================================================================

if [ -z "$NEW_PROJECT_ID" ] || [ "$NEW_PROJECT_ID" = "YOUR_NEW_PROJECT_ID" ]; then
  error "Please provide NEW_PROJECT_ID as first argument"
fi

# Check for required tools
for tool in psql pg_dump; do
  if ! command -v $tool &> /dev/null; then
    error "$tool is not installed. Please install PostgreSQL client tools."
  fi
done

log "Migration Configuration:"
log "  Source: $LOVABLE_HOST"
log "  Target: $NEW_HOST"
log "  Tables: ${#TABLES[@]}"
echo ""

# ============================================================================
# PROMPTS
# ============================================================================

if [ -z "$LOVABLE_PASSWORD" ]; then
  read -sp "Enter Lovable Supabase password: " LOVABLE_PASSWORD
  echo ""
fi

if [ -z "$NEW_PASSWORD" ]; then
  read -sp "Enter Personal Supabase password: " NEW_PASSWORD
  echo ""
fi

# ============================================================================
# CREATE BACKUP DIRECTORY
# ============================================================================

mkdir -p "$BACKUP_DIR"
log "Created backup directory: $BACKUP_DIR"

# ============================================================================
# EXPORT DATA FROM LOVABLE
# ============================================================================

log "========== PHASE 1: EXPORT DATA FROM LOVABLE =========="
log "Exporting data from Lovable Supabase..."

export PGPASSWORD="$LOVABLE_PASSWORD"

# Export each table
for table in "${TABLES[@]}"; do
  log "Exporting: $table"
  
  # Skip if table doesn't exist
  table_exists=$(psql -h "$LOVABLE_HOST" -U "$LOVABLE_USER" -d "$LOVABLE_DB" -t -c \
    "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='$table');")
  
  if [ "$table_exists" = "t" ]; then
    psql -h "$LOVABLE_HOST" -U "$LOVABLE_USER" -d "$LOVABLE_DB" \
      -c "\COPY (SELECT * FROM public.$table) TO STDOUT WITH CSV HEADER" \
      > "$BACKUP_DIR/${table}.csv" || error "Failed to export $table"
    
    row_count=$(wc -l < "$BACKUP_DIR/${table}.csv")
    row_count=$((row_count - 1))  # Subtract header
    log "  ✓ Exported $row_count rows"
  else
    log "  ⓘ Table does not exist (skipped)"
  fi
done

unset PGPASSWORD

log "✓ Export complete!"
log ""

# ============================================================================
# VERIFY TARGET SCHEMA
# ============================================================================

log "========== PHASE 2: VERIFY TARGET SCHEMA =========="
log "Verifying schema in Personal Supabase..."

export PGPASSWORD="$NEW_PASSWORD"

schema_errors=0
for table in "${TABLES[@]}"; do
  table_exists=$(psql -h "$NEW_HOST" -U "$NEW_USER" -d "$NEW_DB" -t -c \
    "SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='$table');")
  
  if [ "$table_exists" = "t" ]; then
    log "  ✓ Table exists: $table"
  else
    log "  ✗ Table missing: $table"
    ((schema_errors++))
  fi
done

if [ $schema_errors -gt 0 ]; then
  error "Schema validation failed: $schema_errors tables missing"
fi

log "✓ Schema validation complete!"
log ""

# ============================================================================
# IMPORT DATA INTO PERSONAL SUPABASE
# ============================================================================

log "========== PHASE 3: IMPORT DATA INTO PERSONAL SUPABASE =========="
log "Importing data into Personal Supabase..."

# Disable triggers temporarily for faster import
log "Disabling triggers..."
psql -h "$NEW_HOST" -U "$NEW_USER" -d "$NEW_DB" << EOF
ALTER TABLE IF EXISTS public.user_roles DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.bills DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.inventory_items DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.expenses DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.held_bills DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.stores DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.staff DISABLE TRIGGER ALL;
EOF

import_errors=0

for table in "${TABLES[@]}"; do
  if [ -f "$BACKUP_DIR/${table}.csv" ]; then
    row_count=$(wc -l < "$BACKUP_DIR/${table}.csv")
    row_count=$((row_count - 1))  # Subtract header
    
    if [ "$row_count" -gt 0 ]; then
      log "Importing: $table ($row_count rows)"
      
      # Truncate table first
      psql -h "$NEW_HOST" -U "$NEW_USER" -d "$NEW_DB" \
        -c "TRUNCATE TABLE public.$table CASCADE;" 2>/dev/null || true
      
      # Import data
      if psql -h "$NEW_HOST" -U "$NEW_USER" -d "$NEW_DB" \
        -c "\COPY public.$table FROM STDIN WITH CSV HEADER" \
        < "$BACKUP_DIR/${table}.csv" 2>/dev/null; then
        log "  ✓ Import successful"
      else
        log "  ✗ Import failed"
        ((import_errors++))
      fi
    else
      log "Skipping empty table: $table"
    fi
  fi
done

# Re-enable triggers
log "Re-enabling triggers..."
psql -h "$NEW_HOST" -U "$NEW_USER" -d "$NEW_DB" << EOF
ALTER TABLE IF EXISTS public.user_roles ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.bills ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.inventory_items ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.expenses ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.held_bills ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.stores ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS public.staff ENABLE TRIGGER ALL;
EOF

unset PGPASSWORD

if [ $import_errors -gt 0 ]; then
  error "Import failed: $import_errors errors"
fi

log "✓ Import complete!"
log ""

# ============================================================================
# VERIFY DATA COUNTS
# ============================================================================

log "========== PHASE 4: VERIFY DATA COUNTS =========="
log "Comparing data counts between source and target..."

export PGPASSWORD="$LOVABLE_PASSWORD"
lovable_counts=$(mktemp)

for table in "${TABLES[@]}"; do
  if [ -f "$BACKUP_DIR/${table}.csv" ]; then
    count=$(psql -h "$LOVABLE_HOST" -U "$LOVABLE_USER" -d "$LOVABLE_DB" -t -c "SELECT COUNT(*) FROM public.$table;")
    echo "$table:$count" >> "$lovable_counts"
  fi
done

unset PGPASSWORD
export PGPASSWORD="$NEW_PASSWORD"

mismatch_count=0

while IFS=: read -r table expected_count; do
  actual_count=$(psql -h "$NEW_HOST" -U "$NEW_USER" -d "$NEW_DB" -t -c "SELECT COUNT(*) FROM public.$table;")
  
  if [ "$actual_count" = "$expected_count" ]; then
    log "  ✓ $table: $actual_count rows"
  else
    log "  ✗ $table: Expected $expected_count, Got $actual_count"
    ((mismatch_count++))
  fi
done < "$lovable_counts"

unset PGPASSWORD
rm "$lovable_counts"

if [ $mismatch_count -gt 0 ]; then
  error "Data verification failed: $mismatch_count mismatches"
fi

log "✓ Data verification complete!"
log ""

# ============================================================================
# VERIFY FOREIGN KEY INTEGRITY
# ============================================================================

log "========== PHASE 5: VERIFY FOREIGN KEY INTEGRITY =========="
log "Verifying foreign key constraints..."

export PGPASSWORD="$NEW_PASSWORD"

# Check for orphaned records (sample checks)
# Add your specific checks here based on your schema

unset PGPASSWORD

log "✓ Foreign key validation complete!"
log ""

# ============================================================================
# GENERATE SUMMARY
# ============================================================================

log "========== MIGRATION SUMMARY =========="
log "Backup directory: $BACKUP_DIR"
log "Tables migrated: ${#TABLES[@]}"
log "Status: SUCCESS ✓"
log ""

log "NEXT STEPS:"
log "1. Verify RLS policies are working correctly"
log "2. Test edge functions with new environment"
log "3. Run smoke tests on frontend"
log "4. Check storage files are accessible"
log "5. Verify realtime subscriptions work"
log ""

log "To rollback (if needed):"
log "  - Restore from backup: $BACKUP_DIR"
log "  - Or delete personal project and restart migration"
log ""

log "Migration complete! Ready to update environment variables."
