import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function parseEnv(envText) {
  return envText.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const [key, ...rest] = trimmed.split('=');
    acc[key] = rest.join('=').replace(/^"|"$/g, '');
    return acc;
  }, {});
}

const envPathCandidates = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'paystore-pos-main', '.env'),
  path.resolve(process.cwd(), '..', 'paystore-pos-main', '.env'),
];

const envPath = envPathCandidates.find((candidate) => fs.existsSync(candidate));
if (!envPath) {
  throw new Error('.env not found');
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const anonKey = env.SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !anonKey || !serviceRole) {
  throw new Error('Missing SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, or SUPABASE_SERVICE_ROLE_KEY in .env');
}

const admin = createClient(supabaseUrl, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const supabase = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testEmails = ['jagralasalman786@gmail.com', 'soihal@gmail.com', 'golden@gmail.com', 'salman@gmail.com', 'sohail@gmail.com', 'pos@gmail.com'];
const testPassword = '253422';

async function main() {
  const { data: listData, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error('listUsers error:', listError.message);
    process.exit(1);
  }
  console.log('Found users:', listData.users.map(u => ({ id: u.id, email: u.email, confirmed: u.email_confirmed_at })).slice(0, 20));

  for (const email of testEmails) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: testPassword,
    });
    console.log('---');
    console.log('email:', email);
    console.log('signIn error:', signInError?.message);
    console.log('signIn user id:', signInData?.user?.id);

    if (signInData?.user?.id) {
      const { data: roleData, error: roleError } = await admin
        .from('user_roles')
        .select('id,user_id,role,store_id,is_active')
        .eq('user_id', signInData.user.id);
      console.log('user_roles for user:', roleError?.message || JSON.stringify(roleData));
    }
  }

  const { data: allRolesData, error: allRolesError, count: allRolesCount } = await admin
    .from('user_roles')
    .select('id', { count: 'exact', head: true });
  console.log('user_roles total count:', allRolesError?.message || allRolesCount);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});