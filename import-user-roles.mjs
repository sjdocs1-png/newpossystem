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
    const [key, ...rest] = line.split('=');
    let value = rest.join('=');
    value = value.replace(/^"|"$/g, '');
    value = value.replace(/^'|'$/g, '');
    acc[key] = value;
    return acc;
  }, {});
}

function parseUserRolesDump(sqlText) {
  const startToken = 'COPY public.user_roles';
  const startIndex = sqlText.indexOf(startToken);
  if (startIndex === -1) return [];

  const dumpSegment = sqlText.slice(startIndex);
  const lines = dumpSegment.split(/\r?\n/);
  const copyLine = lines[0];
  const fields = copyLine.match(/\((.*)\) FROM stdin;/);
  const header = fields ? fields[1].split(', ').map((s) => s.trim()) : [];
  const body = lines.slice(1);
  const rows = [];

  for (const line of body) {
    if (line === '\\.') break;
    if (!line.trim()) continue;
    const values = line.split('\t');
    const row = {};
    for (let i = 0; i < header.length; i += 1) {
      let value = values[i];
      if (value === '\\N' || value === undefined) {
        row[header[i]] = null;
        continue;
      }
      if (value === 't' || value === 'f') {
        row[header[i]] = value === 't';
        continue;
      }
      if (['salary'].includes(header[i])) {
        row[header[i]] = value === '' ? null : Number(value);
        continue;
      }
      row[header[i]] = value;
    }
    rows.push(row);
  }

  return rows;
}

async function main() {
  const envCandidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, 'paystore-pos-main', '.env'),
  ];
  const envPath = envCandidates.find((p) => fs.existsSync(p));
  if (!envPath) throw new Error('.env file not found');

  const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  const sqlPath = path.resolve(__dirname, 'paystore-pos-main', 'paystore_data_only.sql');
  if (!fs.existsSync(sqlPath)) throw new Error('paystore_data_only.sql not found');

  const sqlText = fs.readFileSync(sqlPath, 'utf8');
  const rows = parseUserRolesDump(sqlText);
  if (rows.length === 0) {
    throw new Error('No user_roles rows found in dump');
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const row of rows) {
    const { data, error } = await supabase.from('user_roles').insert(row);
    if (error) {
      console.error('Insert failed for', row.id, row.user_id, error.message);
    } else {
      console.log('Inserted user_role', row.id, row.user_id, row.role);
    }
  }

  console.log('Import finished.');
}

main().catch((err) => {
  console.error('Fatal:', err.message || err);
  process.exit(1);
});