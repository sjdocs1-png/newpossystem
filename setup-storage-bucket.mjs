import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env file manually
function loadEnv() {
  const envPath = path.join(__dirname, 'paystore-pos-main', '.env')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
}

loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'NOT SET')
console.log('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'SET (length: ' + SERVICE_ROLE_KEY.length + ')' : 'NOT SET')

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function setupStorageBucket() {
  console.log('Setting up staff-faces storage bucket...')
  
  try {
    // Create bucket
    console.log('Creating bucket...')
    const { data, error } = await supabase.storage.createBucket('staff-faces', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    })
    
    if (error && !error.message.includes('already exists')) {
      console.error('❌ Bucket creation failed:', error)
      process.exit(1)
    }
    
    console.log('✓ Bucket created or already exists')
    
    // List buckets to verify
    const { data: buckets } = await supabase.storage.listBuckets()
    const staffFacesBucket = buckets?.find(b => b.name === 'staff-faces')
    if (staffFacesBucket) {
      console.log('✓ Verified bucket exists:', staffFacesBucket.name)
    }
    
    console.log('\n✓ Storage bucket setup complete!')
    console.log('\nNote: RLS policies must be applied manually via Supabase Dashboard SQL Editor.')
    console.log('See migration file: supabase/migrations/20260513010000_create_staff_faces_bucket.sql')
    
  } catch (err) {
    console.error('❌ Error:', err)
    process.exit(1)
  }
}

setupStorageBucket()
