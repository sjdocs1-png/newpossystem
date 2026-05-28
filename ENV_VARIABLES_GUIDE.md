# SUPABASE MIGRATION: ENVIRONMENT VARIABLES GUIDE

## 📋 Current Environment (Lovable Supabase)

Your current `.env` file contains:

```env
# Lovable Supabase Project
SUPABASE_URL="https://kqoveyroyhfbcdedyzop.supabase.co"
SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3ZleXJveWhmYmNkZWR5em9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTQ0MzksImV4cCI6MjA4MzgzMDQzOX0.nkCNw8Rp7uzqb_BNMVuUoxnQ__1CzQYT2rXS7yj7ZV0"
VITE_SUPABASE_PROJECT_ID="kqoveyroyhfbcdedyzop"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3ZleXJveWhmYmNkZWR5em9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTQ0MzksImV4cCI6MjA4MzgzMDQzOX0.nkCNw8Rp7uzqb_BNMVuUoxnQ__1CzQYT2rXS7yj7ZV0"
VITE_SUPABASE_URL="https://kqoveyroyhfbcdedyzop.supabase.co"
```

## 🚀 New Environment (Personal Supabase)

After creating your personal Supabase project, you'll have:

```env
# Personal Supabase Project
SUPABASE_URL="https://[NEW_PROJECT_ID].supabase.co"
SUPABASE_PUBLISHABLE_KEY="[NEW_ANON_KEY]"
VITE_SUPABASE_PROJECT_ID="[NEW_PROJECT_ID]"
VITE_SUPABASE_PUBLISHABLE_KEY="[NEW_ANON_KEY]"
VITE_SUPABASE_URL="https://[NEW_PROJECT_ID].supabase.co"
```

## 🔑 How to Get Your New Keys

### Step 1: Create Personal Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or login to your account
3. Click "New Project"
4. Fill in:
   - **Organization:** Your organization
   - **Project name:** e.g., "paystore-pos-personal"
   - **Database password:** Create a secure password (save it!)
   - **Region:** Same as Lovable for latency (likely India or closest to you)
5. Click "Create new project"
6. Wait 5-10 minutes for database initialization

### Step 2: Get Your New Project ID

After project creation:

1. Go to **Settings** → **General**
2. Copy the **Project URL**: `https://[NEW_PROJECT_ID].supabase.co`
3. Extract `[NEW_PROJECT_ID]` from the URL
4. **Note:** `[NEW_PROJECT_ID]`

### Step 3: Get Your New Anon Key

1. Go to **Settings** → **API**
2. Under "Project API keys" section
3. Copy the **anon public** key
4. **Note:** `[NEW_ANON_KEY]`

### Step 4: Get Your Service Role Key (For Migrations)

1. Go to **Settings** → **API**
2. Under "Project API keys" section
3. Copy the **service_role secret** key
4. **Note:** `[NEW_SERVICE_KEY]` (KEEP SAFE - do not commit to git)

## 📝 Step-by-Step Variable Update

### For Frontend (.env file)

```bash
# Navigate to project root
cd paystore-pos-main

# Backup current .env
cp .env .env.lovable.backup

# Update all occurrences
# Replace kqoveyroyhfbcdedyzop with your NEW_PROJECT_ID
# Replace the old PUBLISHABLE_KEY with NEW_ANON_KEY

# Using sed (Linux/Mac):
sed -i 's/kqoveyroyhfbcdedyzop/YOUR_NEW_PROJECT_ID/g' .env
sed -i 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtxb3ZleXJveWhmYmNkZWR5em9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNTQ0MzksImV4cCI6MjA4MzgzMDQzOX0.nkCNw8Rp7uzqb_BNMVuUoxnQ__1CzQYT2rXS7yj7ZV0/YOUR_NEW_ANON_KEY/g' .env

# Or manually edit .env:
SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"
SUPABASE_PUBLISHABLE_KEY="YOUR_NEW_ANON_KEY"
VITE_SUPABASE_PROJECT_ID="YOUR_NEW_PROJECT_ID"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_NEW_ANON_KEY"
VITE_SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"
```

### For Supabase Config (config.toml)

```bash
# Update supabase/config.toml
cd supabase

# Change the project_id at the top
project_id = "YOUR_NEW_PROJECT_ID"

# Keep all function configurations the same
[functions.delete-owner]
verify_jwt = false

# ... (all other functions remain unchanged)
```

### For Edge Function Secrets

```bash
# Set secrets in personal Supabase project
supabase secrets set \
  --project-ref YOUR_NEW_PROJECT_ID \
  OPENAI_API_KEY="your-openai-key"

supabase secrets set \
  --project-ref YOUR_NEW_PROJECT_ID \
  LOVABLE_API_KEY="your-lovable-key"

supabase secrets set \
  --project-ref YOUR_NEW_PROJECT_ID \
  SUPABASE_URL="https://YOUR_NEW_PROJECT_ID.supabase.co"

supabase secrets set \
  --project-ref YOUR_NEW_PROJECT_ID \
  SUPABASE_ANON_KEY="YOUR_NEW_ANON_KEY"

supabase secrets set \
  --project-ref YOUR_NEW_PROJECT_ID \
  SUPABASE_SERVICE_ROLE_KEY="YOUR_NEW_SERVICE_KEY"
```

## ✅ Verification Checklist

After updating environment variables:

```bash
# 1. Verify .env is updated
cat .env | grep "supabase.co"
# Should show YOUR_NEW_PROJECT_ID, not kqoveyroyhfbcdedyzop

# 2. Verify config.toml
cat supabase/config.toml | head -1
# Should show: project_id = "YOUR_NEW_PROJECT_ID"

# 3. Test connection
npm run build

# 4. Run app and test login
npm run dev

# 5. Check browser console
# Should see new Supabase URL in network requests
```

## 📊 Variable Mapping Reference

| Variable | Old Value | New Value | File |
|----------|-----------|-----------|------|
| SUPABASE_URL | `https://kqoveyroyhfbcdedyzop.supabase.co` | `https://[NEW_ID].supabase.co` | `.env` |
| VITE_SUPABASE_URL | Same as above | Same as above | `.env` |
| VITE_SUPABASE_PROJECT_ID | `kqoveyroyhfbcdedyzop` | `[NEW_PROJECT_ID]` | `.env` |
| SUPABASE_PUBLISHABLE_KEY | `eyJhbGc...` | `[NEW_ANON_KEY]` | `.env` |
| VITE_SUPABASE_PUBLISHABLE_KEY | Same as above | Same as above | `.env` |
| project_id (config.toml) | `kqoveyroyhfbcdedyzop` | `[NEW_PROJECT_ID]` | `supabase/config.toml` |

## 🔐 Security Notes

1. **Never commit service keys to git:**
   ```bash
   # Add to .gitignore
   echo ".env.local" >> .gitignore
   echo ".env*.backup" >> .gitignore
   ```

2. **Keep .env.lovable.backup safe** (contains old keys)

3. **Rotate old Lovable keys after migration** (for security)

4. **Use environment variables, not hardcoded keys**

5. **Different keys for different environments:**
   ```
   Development:   YOUR_NEW_PROJECT_ID (test)
   Staging:       Another Supabase project
   Production:    Production Supabase project (separate from test)
   ```

## 🚨 Common Mistakes to Avoid

❌ **DO NOT:**
- Hardcode keys in frontend code
- Commit .env files to git
- Mix Lovable and Personal keys
- Forget to update config.toml
- Use old keys after migration

✅ **DO:**
- Keep backup of old keys (.env.lovable.backup)
- Update all three URL variables
- Update project_id in config.toml
- Test after each change
- Document the new environment

## 📞 Troubleshooting

### App still connects to Lovable after update

```bash
# Check if build cache exists
rm -rf dist
rm -rf node_modules/.vite

# Rebuild
npm run build

# Check network tab in browser DevTools
# Should see NEW_PROJECT_ID in API calls
```

### Getting 401 Unauthorized errors

```bash
# Verify anon key is correct
cat .env | grep PUBLISHABLE_KEY

# Check if key format is correct (should start with "ey")
# Check if key matches in both places

# Regenerate keys if needed:
# Settings → API → Click regenerate (will invalidate old key!)
```

### Environment variables not loading

```bash
# For Vite projects, need VITE_ prefix
# Make sure all VITE_ variables are set

# Check environment loading:
npm run dev -- --debug

# Or in code:
console.log(import.meta.env.VITE_SUPABASE_URL)
```

## 📋 Final Checklist

- [ ] New Supabase project created
- [ ] New Project ID noted
- [ ] New Anon Key copied
- [ ] New Service Role Key saved securely
- [ ] .env file updated with new values
- [ ] config.toml updated
- [ ] .env.lovable.backup created
- [ ] Build cache cleared (rm -rf dist)
- [ ] Application rebuilt (npm run build)
- [ ] Login tested with new project
- [ ] No console errors in DevTools
- [ ] Network requests show new project ID
- [ ] Old Lovable environment backed up

## ✨ Next Steps

After updating environment variables:

1. **Rebuild frontend:** `npm run build`
2. **Deploy edge functions:** `supabase functions deploy --project-ref [NEW_ID]`
3. **Run data migration:** `./supabase_migrate_data.sh [NEW_PROJECT_ID]`
4. **Run auth migration:** `npx ts-node migrate-auth-users.ts`
5. **Verify migration:** Run `verify_migration.sql`
6. **Test all features:** Login, create bill, manage inventory, etc.
7. **Monitor for 48 hours** before decommissioning Lovable

---

**READY FOR MIGRATION!** 🚀
