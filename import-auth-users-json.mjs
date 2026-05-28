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

function generateTempPassword(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let pass = '';
  for (let i = 0; i < length; i += 1) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
}

async function main() {
  const envFileCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '.env'),
  ];

  let envPath;
  for (const candidate of envFileCandidates) {
    if (fs.existsSync(candidate)) {
      envPath = candidate;
      break;
    }
  }

  if (!envPath) {
    throw new Error('.env file not found in current directory or script directory');
  }

  const envText = fs.readFileSync(envPath, 'utf8');
  const env = parseEnv(envText);

  const personalUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const personalServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!personalUrl || !personalServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const jsonPathCandidates = [
    path.resolve(process.cwd(), 'auth_users_export.json'),
    path.resolve(__dirname, 'auth_users_export.json'),
  ];

  let jsonPath;
  for (const candidate of jsonPathCandidates) {
    if (fs.existsSync(candidate)) {
      jsonPath = candidate;
      break;
    }
  }

  if (!jsonPath) {
    throw new Error('auth_users_export.json file not found in current directory or script directory');
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const payload = JSON.parse(raw);
  const users = payload.users || [];

  if (!Array.isArray(users) || users.length === 0) {
    throw new Error('No users found in auth_users_export.json');
  }

  const supabaseAdmin = createClient(personalUrl, personalServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const outputRows = ['id,email,temp_password,status,error'];

  for (const user of users) {
    const tempPassword = generateTempPassword(20);

    const createPayload = {
      id: user.id,
      email: user.email,
      password: tempPassword,
      email_confirm: Boolean(user.email_confirmed_at),
      user_metadata: user.raw_user_meta_data || {},
      raw_user_meta_data: user.raw_user_meta_data || {},
      phone: user.phone || undefined,
      phone_confirm: Boolean(user.phone_confirmed_at),
    };

    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser(createPayload);
      if (error) {
        console.error(`✗ ${user.email}: ${error.message}`);
        outputRows.push(`${user.id},${user.email},${tempPassword},failed,${JSON.stringify(error.message).replace(/\r?\n/g, ' ')}`);
        continue;
      }

      console.log(`✓ Created ${user.email} (${data.user.id})`);
      outputRows.push(`${user.id},${user.email},${tempPassword},success,`);
    } catch (err) {
      const message = err instanceof Error ? err.message : JSON.stringify(err);
      console.error(`✗ ${user.email}: ${message}`);
      outputRows.push(`${user.id},${user.email},${tempPassword},failed,${JSON.stringify(message).replace(/\r?\n/g, ' ')}`);
    }
  }

  fs.writeFileSync(new URL('./auth_user_temp_passwords.csv', import.meta.url), outputRows.join('\n'), 'utf8');
  console.log('\nDone. Temp passwords saved to auth_user_temp_passwords.csv');
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exit(1);
});
