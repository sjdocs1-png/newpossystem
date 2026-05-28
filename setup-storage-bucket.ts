import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// Create bucket
const { error: bucketError } = await supabase
  .storage
  .createBucket('staff-faces', { public: true })

if (bucketError && !bucketError.message.includes('already exists')) {
  console.error('Bucket creation error:', bucketError)
  throw bucketError
}

console.log('✓ Bucket created or already exists')

// Create RLS policies (requires using Postgres directly via edge function)
// For now, we'll document what needs to be run manually
console.log(`
=== Manual Migration Required ===
Please run the following SQL in Supabase SQL Editor:

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload face photos"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'staff-faces');

-- Policy 2: Allow public read access
CREATE POLICY "Allow public read access to face photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'staff-faces');

-- Policy 3: Allow authenticated users to update
CREATE POLICY "Allow authenticated users to update face photos"
ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'staff-faces')
WITH CHECK (bucket_id = 'staff-faces');

-- Policy 4: Allow authenticated users to delete
CREATE POLICY "Allow authenticated users to delete face photos"
ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'staff-faces');

-- Policy 5: Service role full access
CREATE POLICY "Service role full access to staff-faces"
ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'staff-faces')
WITH CHECK (bucket_id = 'staff-faces');
`)

console.log('✓ Setup complete')
