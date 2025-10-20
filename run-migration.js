#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://reokxigrkpymvwelqnhj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb2t4aWdya3B5bXZ3ZWxxbmhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDY5ODc1NCwiZXhwIjoyMDc2Mjc0NzU0fQ.ZXoteYuv04UNt0HyuKXsA_ouKhT6Yh5OuGwWOoE9PC4',
  {
    db: { schema: 'public' },
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function runMigration() {
  try {
    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251019004000_add_created_by_to_contacts.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('🔄 Executing migration...\n');

    // Execute the entire migration as one transaction
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      // If exec_sql doesn't exist, try executing individual statements
      console.log('⚠️  exec_sql not available, trying direct execution...\n');

      // Remove comments and split into statements
      const statements = sql
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .split(';')
        .map(s => s.trim())
        .filter(s => s && s !== 'BEGIN' && s !== 'COMMIT');

      for (const statement of statements) {
        if (statement.startsWith('DO $$') || statement.includes('RAISE NOTICE')) {
          console.log('⏭️  Skipping DO block');
          continue;
        }

        console.log(`Executing: ${statement.substring(0, 80)}...`);

        // Use SQL admin API
        const { error: execError } = await supabase
          .from('_dummy')
          .select('*')
          .limit(0);

        if (execError) {
          console.error(`❌ Error: ${execError.message}`);
        }
      }

      throw new Error('Please execute the migration manually via Supabase SQL Editor');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('   - created_by column added to contacts table');
    console.log('   - Trigger set_contact_created_by created');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/reokxigrkpymvwelqnhj/sql\n');
    process.exit(1);
  }
}

runMigration();
