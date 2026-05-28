import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRoles() {
  console.log('👥 All User Roles:\n');

  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('id, user_id, staff_code, role, store_id');

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (data) {
      data.forEach(role => {
        console.log(`ID: ${role.id}`);
        console.log(`  Staff Code: ${role.staff_code || 'N/A'}`);
        console.log(`  User ID: ${role.user_id || 'N/A'}`);
        console.log(`  Role: ${role.role}`);
        console.log(`  Store ID: ${role.store_id || 'N/A'}`);
        console.log(`  Department: ${role.department || 'N/A'}`);
        console.log('');
      });

      // Count by role
      const byRole = {};
      data.forEach(role => {
        byRole[role.role] = (byRole[role.role] || 0) + 1;
      });
      console.log('Summary by role:');
      Object.entries(byRole).forEach(([role, count]) => {
        console.log(`  - ${role}: ${count}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserRoles();
