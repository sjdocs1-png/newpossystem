# 🚨 Apply Checklist Schema Migration – Fix 400 Errors

## Issue
Your app is trying to use `checklist_templates.owner_id` and `checklist_settings.owner_id`, but these columns don't exist in your Supabase database yet.

**Error in logs:**
```
Could not find the 'owner_id' column of 'checklist_templates' in the schema cache
POST .../checklist_settings?on_conflict=owner_id,store_id  400 (Bad Request)
```

## Solution – Apply Migration

### Option 1: Using Supabase CLI (Recommended)

```powershell
cd g:\paystore-pos-main\paystore-pos-main
supabase db push --project-ref pdjroppybrndaldgcdzk
```

**If prompted to confirm:** Type `y` and press Enter.

### Option 2: Manual SQL in Supabase Console

1. Go to [Supabase Console](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** → **New Query**
4. Copy all SQL from `supabase/migrations/20260521_FINAL_CHECKLIST_SYSTEM_FIX.sql`
5. Paste and run

### Option 3: Push All Pending Migrations

```powershell
cd g:\paystore-pos-main\paystore-pos-main
supabase db push
```

---

## Verify Migration Applied ✅

After running the migration, check your browser console. You should see:
- ✅ No more 400 errors on checklist_settings upsert
- ✅ No more "owner_id column missing" errors
- ✅ Template creation dialog should work

---

## What the Migration Does

- ✅ Adds `owner_id` UUID column to `checklist_templates`
- ✅ Adds `owner_id` UUID column to `checklist_settings`
- ✅ Creates unique index: `(owner_id, store_id)`
- ✅ Sets up RLS policies for owner-only access
- ✅ Backfills existing rows from store_users

---

## Still Getting Errors After Migration?

1. Clear browser cache: `Ctrl+Shift+Delete`
2. Hard refresh: `Ctrl+Shift+R`
3. Check Supabase console for any migration failures
4. Run `supabase db push --dry-run` to see what would run
