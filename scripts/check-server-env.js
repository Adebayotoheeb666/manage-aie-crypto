import 'dotenv/config';

console.log('🔍 Server Environment Variables Check\n');
console.log('════════════════════════════════════════\n');

const envVars = [
  'VITE_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SESSION_JWT_SECRET'
];

let allPresent = true;

envVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌';
  const display = value ? (value.substring(0, 20) + '...') : 'NOT SET';
  console.log(`${status} ${varName.padEnd(35)} ${display}`);
  
  if (!value && ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].includes(varName)) {
    allPresent = false;
  }
});

console.log('\n════════════════════════════════════════\n');

if (allPresent) {
  console.log('✅ All critical environment variables are set');
} else {
  console.log('❌ Missing critical environment variables!');
  console.log('\n💡 Make sure your .env file contains:');
  console.log('   - VITE_SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
}

console.log('\n');
