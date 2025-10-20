const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://reokxigrkpymvwelqnhj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb2t4aWdya3B5bXZ3ZWxxbmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5ODc1NCwiZXhwIjoyMDc2Mjc0NzU0fQ.ZXoteYuv04UNt0HyuKXsA_ouKhT6Yh5OuGwWOoE9PC4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251019004000_add_created_by_to_contacts.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct SQL execution
      console.log('Trying direct SQL execution...');
      const { error: execError } = await supabase.from('_sql').select(sql);
      if (execError) {
        throw execError;
      }
    }

    console.log('✅ Migration applied successfully');
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();
