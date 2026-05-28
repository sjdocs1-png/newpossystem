import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseEnv(envText) {
  return envText.split(/\r?\n/).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const [key, ...rest] = trimmed.split('=');
    acc[key] = rest.join('=').replace(/^"|"$/g, '');
    return acc;
  }, {});
}

async function main() {
  const envPath = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '.env'),
  ].find((p) => fs.existsSync(p));

  if (!envPath) {
    throw new Error('.env file not found in current directory or script directory');
  }

  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const jsonPath = [
    path.resolve(process.cwd(), 'auth_users_export.json'),
    path.resolve(__dirname, 'auth_users_export.json'),
  ].find((p) => fs.existsSync(p));

  if (!jsonPath) {
    throw new Error('auth_users_export.json not found in current directory or script directory');
  }

  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const users = payload.users;
  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('No users found in auth_users_export.json');
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const outputRows = ['id,email,status,error'];
  const password = '253422';

  for (const user of users) {
    if (!user.id || !user.email) continue;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
    });

    if (error) {
      console.error(`✗ ${user.email} (${user.id}): ${error.message}`);
      outputRows.push(`${user.id},${user.email},failed,${error.message.replace(/\r?\n/g, ' ')}`);
      continue;
    }

    console.log(`✓ Updated ${user.email}`);
    outputRows.push(`${user.id},${user.email},success,`);
  }

  fs.writeFileSync(path.resolve(__dirname, 'auth_password_reset_results.csv'), outputRows.join('\n'), 'utf8');
  console.log('\nDone. Results written to auth_password_reset_results.csv');
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exit(1);
});