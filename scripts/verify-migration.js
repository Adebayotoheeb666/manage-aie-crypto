import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function verifyMigration() {
  console.log('🔍 Checking if primary_wallet_address column exists...\n');
  
  try {
    // Try to query using primary_wallet_address column
    const { data, error } = await supabase
      .from('users')
      .select('id, email, primary_wallet_address')
      .limit(1);
    
    if (error) {
      if (error.message.includes('primary_wallet_address')) {
        console.log('❌ MIGRATION NOT RUN');
        console.log('   The primary_wallet_address column does NOT exist');
        console.log('\n📋 To fix this:');
        console.log('   1. Go to: https://cgigmuugieqaqxmysgrs.supabase.co/project/_/sql');
        console.log('   2. Click "New Query"');
        console.log('   3. Copy and paste the contents of:');
        console.log('      supabase/migration-wallet-auth-fix.sql');
        console.log('   4. Click "Run" or press Ctrl+Enter');
        console.log('   5. Restart your dev server\n');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
      process.exit(1);
    }
    
    console.log('✅ MIGRATION SUCCESSFUL');
    console.log('   The primary_wallet_address column exists');
    console.log('   Found', data?.length || 0, 'user(s) in database');
    
    if (data && data.length > 0) {
      console.log('\n📊 Sample data:');
      console.log(data);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifyMigration();
