# CHECKLIST SYSTEM TECHNICAL SPECIFICATION
## RLS, Owner_ID & Production-Ready Implementation

---

## TABLE OF CONTENTS
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [RLS Policies](#rls-policies)
4. [Frontend Integration](#frontend-integration)
5. [Error Handling](#error-handling)
6. [Testing Procedures](#testing-procedures)

---

## SYSTEM ARCHITECTURE

### Ownership Model
```
┌─────────────────────────────────────────────┐
│  Owner (Customer)                           │
│  - Owns entire checklist system for stores  │
│  - Can create/edit/delete templates         │
│  - Can assign checklists to staff           │
│  - Can approve submissions                  │
│  - Can view all data                        │
└────────┬────────────────────────────────────┘
         │
         ├─────────────────────────────────────────────┐
         │                                             │
    ┌────▼─────────────────┐         ┌────────────────▼────────┐
    │ Store 1              │         │ Store 2                 │
    │ - Owned by Owner     │         │ - Owned by Owner        │
    │ - Has Templates      │         │ - Has Templates         │
    │ - Has Settings       │         │ - Has Settings          │
    │ - Has Assignments    │         │ - Has Assignments       │
    └────┬─────────────────┘         └────────────────┬────────┘
         │                                             │
    ┌────▼──────────────┐           ┌────────────────▼────────┐
    │ Staff Members      │           │ Staff Members           │
    │ - Complete tasks   │           │ - Complete tasks        │
    │ - Submit evidence  │           │ - Submit evidence       │
    │ - View own status  │           │ - View own status       │
    └────────────────────┘           └─────────────────────────┘
```

### Permission Matrix

| Operation | Owner | Manager | Staff |
|-----------|-------|---------|-------|
| Create Template | ✅ | ❌ | ❌ |
| Edit Template | ✅ | ❌ | ❌ |
| Delete Template | ✅ | ❌ | ❌ |
| View Template | ✅ | ✅ | ✅ |
| Create Assignment | ✅ | ✅ | ❌ |
| View Assignment | ✅ | ✅ | ✅ (own) |
| Complete Assignment | ❌ | ❌ | ✅ (own) |
| Manage Settings | ✅ | ❌ | ❌ |
| View Settings | ✅ | ✅ | ✅ |
| Approve Submission | ✅ | ✅ | ❌ |
| Submit Evidence | ❌ | ❌ | ✅ |

---

## DATABASE SCHEMA

### Core Tables with owner_id

#### checklist_templates
```sql
CREATE TABLE public.checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership (CRITICAL)
  owner_id uuid NOT NULL,                -- ✅ FK to auth.users, required for RLS
  customer_id uuid NOT NULL,             -- Customer owning all stores
  store_id uuid NOT NULL,                -- Store where template is active
  
  -- Template definition
  category_id uuid REFERENCES checklist_categories(id),
  name text NOT NULL,
  description text,
  checklist_type text DEFAULT 'general',
  points integer DEFAULT 0,
  
  -- Requirements
  requires_ai_verification boolean DEFAULT false,
  requires_live_capture boolean DEFAULT false,
  requires_photo boolean DEFAULT true,
  requires_video boolean DEFAULT false,
  requires_gps boolean DEFAULT false,
  
  -- Audit fields
  is_active boolean DEFAULT true,
  created_by uuid,                       -- Who created it
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_checklist_templates_owner_id ON public.checklist_templates(owner_id);
CREATE INDEX idx_checklist_templates_store_id_owner_id ON public.checklist_templates(store_id, owner_id);
```

**Key Points:**
- `owner_id` is NOT NULL - every template MUST have an owner
- `owner_id` is the RLS enforcement point
- `customer_id` is for customer-level queries
- `store_id` identifies which store this template applies to

#### checklist_settings
```sql
CREATE TABLE public.checklist_settings (
  store_id uuid PRIMARY KEY,             -- One settings row per store
  owner_id uuid,                         -- FK to owner (set during creation)
  customer_id uuid,                      -- FK to customer
  
  -- Settings stored as JSONB for flexibility
  settings jsonb DEFAULT '{}'::jsonb,
  
  -- Audit fields
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT checklist_settings_store_id_unique UNIQUE(store_id)
);

CREATE INDEX idx_checklist_settings_owner_id ON public.checklist_settings(owner_id);
CREATE INDEX idx_checklist_settings_store_id_owner_id ON public.checklist_settings(store_id, owner_id);
```

**Key Points:**
- One row per store (store_id is primary key)
- `owner_id` set at creation time (from auth.uid())
- Settings stored as JSONB for extensibility

#### checklist_assignments
```sql
CREATE TABLE public.checklist_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  owner_id uuid NOT NULL,                -- Store owner
  
  -- References
  template_id uuid REFERENCES checklist_templates(id) ON DELETE CASCADE,
  assigned_by uuid,                      -- Who created assignment
  staff_id uuid NOT NULL,                -- Who it's assigned to
  store_id uuid NOT NULL,                -- Which store
  
  -- Scheduling
  due_at timestamptz,
  priority text DEFAULT 'normal',
  recurrence jsonb,                      -- Recurring assignment rules
  
  -- Status tracking
  status text DEFAULT 'assigned',
  instructions text,
  
  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_checklist_assignments_owner_id ON public.checklist_assignments(owner_id);
CREATE INDEX idx_checklist_assignments_status ON public.checklist_assignments(status);
CREATE INDEX idx_checklist_assignments_store_id_status ON public.checklist_assignments(store_id, status);
```

**Status Enum:**
```sql
CREATE TYPE public.checklist_assignment_status AS ENUM (
  'assigned',        -- Initial state
  'in_progress',     -- Staff has started
  'pending_review',  -- Staff submitted, awaiting review
  'approved',        -- Approved by manager/owner
  'rejected',        -- Rejected, needs resubmission
  'completed'        -- Final approved state
);
```

---

## RLS POLICIES

### Policy Design Principles

1. **Explicit Ownership**: Every operation checked against `owner_id`
2. **Role-Based Access**: Different permissions per store_users.role
3. **No Public Access**: No anonymous or unauthenticated access
4. **Fail-Safe**: If policy undefined, access denied (default RLS behavior)

### checklist_templates Policies

```sql
-- POLICY 1: Owner full access (all operations)
CREATE POLICY checklist_templates_owner_all ON public.checklist_templates
  FOR ALL
  USING (auth.uid()::uuid = owner_id)
  WITH CHECK (auth.uid()::uuid = owner_id);

-- POLICY 2: Manager read-only
CREATE POLICY checklist_templates_manager_read ON public.checklist_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = checklist_templates.store_id
        AND su.user_id = auth.uid()
        AND su.role IN ('manager', 'store_manager')
    )
  );

-- POLICY 3: Staff read-only
CREATE POLICY checklist_templates_staff_read ON public.checklist_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = checklist_templates.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'staff'
    )
  );
```

**How it works:**

1. **Owner Insert**:
   - Auth user tries: `INSERT INTO checklist_templates (owner_id: 'abc-123', ...)`
   - RLS checks: `auth.uid()::uuid = 'abc-123'` (USING clause)
   - If true ✅, INSERT allowed
   - If false ❌, INSERT blocked with 403 Forbidden

2. **Manager Query**:
   - Auth user (manager) tries: `SELECT * FROM checklist_templates WHERE store_id = 'x'`
   - RLS checks: User has store_users row with role='manager' ✅
   - All matching templates returned

3. **Staff Update** (Blocked):
   - Auth user (staff) tries: `UPDATE checklist_templates SET name='...' WHERE id='t1'`
   - No matching policy allows UPDATE for staff ❌
   - Blocked with 403 Forbidden

### checklist_settings Policies

```sql
-- POLICY 1: Owner full access
CREATE POLICY checklist_settings_owner_all ON public.checklist_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = checklist_settings.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = checklist_settings.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'owner'
    )
  );

-- POLICY 2: Manager read-only
CREATE POLICY checklist_settings_manager_read ON public.checklist_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = checklist_settings.store_id
        AND su.user_id = auth.uid()
        AND su.role IN ('manager', 'store_manager')
    )
  );

-- POLICY 3: Staff read-only
CREATE POLICY checklist_settings_staff_read ON public.checklist_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.store_users su
      WHERE su.store_id = checklist_settings.store_id
        AND su.user_id = auth.uid()
        AND su.role = 'staff'
    )
  );
```

---

## FRONTEND INTEGRATION

### OwnerChecklistBuilderPage.tsx

#### Template Creation Flow

```typescript
const handleTemplateSave = async () => {
  // 1. Validate input
  if (!templateForm.name.trim() || !storeId) {
    toast.error('Template name is required.');
    return;
  }

  // 2. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    toast.error('Authentication required to create templates.');
    return;
  }

  // 3. Verify ownership
  if (!isOwner) {
    toast.error('Permission denied: only owners can create templates.');
    return;
  }

  // 4. Build payload WITH owner_id (CRITICAL)
  const payload = {
    owner_id: user.id,                          // ✅ MUST be included
    customer_id: customerId || store?.customer_id,
    store_id: storeId,
    name: templateForm.name.trim(),
    description: templateForm.description.trim() || null,
    checklist_type: templateForm.checklist_type,
    points: templateForm.points,
    requires_ai_verification: templateForm.requires_ai_verification,
    requires_live_capture: templateForm.requires_live_capture,
    requires_photo: templateForm.requires_photo,
    requires_gps: templateForm.requires_gps,
    is_active: templateForm.is_active,
    created_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 5. Insert (single attempt, no retry logic)
  const { error } = await supabase.from('checklist_templates').insert(payload);

  if (error) {
    // RLS violation
    if (error.message?.includes('row-level security')) {
      toast.error('Permission denied: RLS policy prevents this operation.');
      throw new Error('RLS violation');
    }
    // Schema issue
    if (error.message?.includes('checklist_templates')) {
      toast.error('Template schema error. Verify database migration ran.');
      throw new Error('Schema error');
    }
    // Other errors
    throw error;
  }

  toast.success('Template created successfully.');
  setTemplateDialogOpen(false);
  loadTemplates();
};
```

### useStoreSettings.ts

#### Initialization with owner_id

```typescript
const loadChecklistSettingsFromDB = async (storeId: string) => {
  try {
    // Attempt to fetch existing settings row
    const { data, error } = await supabase
      .from('checklist_settings')
      .select('*')
      .eq('store_id', storeId)
      .maybeSingle();

    if (error) throw error;

    // If row doesn't exist, create with default settings
    if (!data) {
      // Get current user for owner_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        console.warn('Cannot create settings: user not authenticated');
        return {};
      }

      // Upsert with owner_id (CRITICAL)
      const { data: newRow, error: upsertError } = await supabase
        .from('checklist_settings')
        .upsert(
          {
            store_id: storeId,
            owner_id: user.id,           // ✅ MUST be included
            checklist_enabled: true,
          },
          { onConflict: 'store_id' }
        )
        .select('*')
        .single();

      if (upsertError) throw upsertError;
      return parseChecklistSettingsRow(newRow);
    }

    // Parse and return existing settings
    return parseChecklistSettingsRow(data);
  } catch (error) {
    console.error('Error loading settings:', error);
    throw error;
  }
};
```

---

## ERROR HANDLING

### Expected Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `row-level security policy` | owner_id mismatch or policy violation | Verify auth.uid() matches owner_id |
| `Could not find column owner_id` | Schema not migrated | Run migration: 20260521_FINAL_CHECKLIST_SYSTEM_FIX.sql |
| `permission denied` | User lacks store_users role | Add user to store_users with appropriate role |
| `unique violation on store_id` | Duplicate settings row | Use UPSERT with onConflict:'store_id' |
| `NOT NULL constraint violation` | owner_id not provided | Always include owner_id in INSERT |

### Error Detection & Logging

```typescript
const handleSupabaseError = (error: any) => {
  const message = error.message || '';
  const details = error.details || '';
  
  if (message.includes('row-level security')) {
    console.error('[RLS] Policy violation:', {
      table: error.metadata?.table,
      policy: error.metadata?.policy,
      details,
    });
    return 'RLS_VIOLATION';
  }
  
  if (message.includes('NOT NULL')) {
    console.error('[Schema] Required field missing:', details);
    return 'NULL_CONSTRAINT';
  }
  
  if (message.includes('unique violation')) {
    console.error('[Data] Duplicate key:', details);
    return 'UNIQUE_VIOLATION';
  }
  
  console.error('[Unknown]', error);
  return 'UNKNOWN_ERROR';
};
```

---

## TESTING PROCEDURES

### Unit Test: Template Creation

```typescript
describe('Checklist Template Creation', () => {
  it('should create template with owner_id', async () => {
    const user = await supabase.auth.getUser();
    
    const payload = {
      owner_id: user.id,
      store_id: testStoreId,
      name: 'Test Template',
      customer_id: testCustomerId,
    };
    
    const { data, error } = await supabase
      .from('checklist_templates')
      .insert(payload)
      .select();
    
    expect(error).toBeNull();
    expect(data[0].owner_id).toBe(user.id);
  });
  
  it('should fail if owner_id is missing', async () => {
    const payload = {
      store_id: testStoreId,
      name: 'Test Template',
      customer_id: testCustomerId,
      // ❌ Missing owner_id
    };
    
    const { error } = await supabase
      .from('checklist_templates')
      .insert(payload);
    
    expect(error).toBeDefined();
    expect(error.message).toContain('NOT NULL');
  });
  
  it('should fail if owner_id does not match auth.uid()', async () => {
    const wrongUserId = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
    
    const payload = {
      owner_id: wrongUserId,  // ❌ Not current user
      store_id: testStoreId,
      name: 'Test Template',
    };
    
    const { error } = await supabase
      .from('checklist_templates')
      .insert(payload);
    
    expect(error?.message).toContain('row-level security');
  });
});
```

### Integration Test: Settings Upsert

```typescript
describe('Settings Initialization', () => {
  it('should create settings with owner_id on first upsert', async () => {
    const user = await supabase.auth.getUser();
    const testStore = generateTestStoreId();
    
    const { data, error } = await supabase
      .from('checklist_settings')
      .upsert(
        {
          store_id: testStore,
          owner_id: user.id,
          checklist_enabled: true,
        },
        { onConflict: 'store_id' }
      )
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data.owner_id).toBe(user.id);
    expect(data.checklist_enabled).toBe(true);
  });
  
  it('should merge settings on subsequent upsert', async () => {
    // First upsert
    await supabase.from('checklist_settings').upsert({
      store_id: testStore,
      owner_id: user.id,
      checklist_enabled: true,
    }, { onConflict: 'store_id' });
    
    // Second upsert with additional settings
    const { data, error } = await supabase
      .from('checklist_settings')
      .upsert(
        {
          store_id: testStore,
          owner_id: user.id,
          settings: { enable_ai_verification: true },
        },
        { onConflict: 'store_id' }
      )
      .select()
      .single();
    
    expect(error).toBeNull();
    expect(data.checklist_enabled).toBe(true);
    expect(data.settings.enable_ai_verification).toBe(true);
  });
});
```

---

## DEPLOYMENT CHECKLIST

- [ ] Run migration: `supabase db push`
- [ ] Verify schema: Check owner_id NOT NULL
- [ ] Verify RLS: Check policies exist
- [ ] Deploy frontend: OwnerChecklistBuilderPage.tsx + useStoreSettings.ts
- [ ] Clear browser cache
- [ ] Test template creation
- [ ] Test settings save
- [ ] Monitor error logs
- [ ] Verify user feedback
- [ ] Production ready ✅

---

## REFERENCES

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Migration File](./20260521_FINAL_CHECKLIST_SYSTEM_FIX.sql)
