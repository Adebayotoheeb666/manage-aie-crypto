import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function resetDatabase() {
  try {
    console.log('Resetting test database...');
    
    // Drop all tables
    const dropTables = `
      DROP TABLE IF EXISTS price_alerts CASCADE;
      DROP TABLE IF EXISTS portfolio_snapshots CASCADE;
      DROP TABLE IF EXISTS withdrawal_requests CASCADE;
      DROP TABLE IF EXISTS transactions CASCADE;
      DROP TABLE IF EXISTS assets CASCADE;
      DROP TABLE IF EXISTS wallets CASCADE;
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS price_history CASCADE;
    `;
    
    // Execute drop statements
    const statements = dropTables
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('pg_temp.execute_sql', { sql: statement });
        if (error) {
          console.warn('Error executing statement:', error.message);
        }
      }
    }
    
    console.log('Test database reset completed');
    process.exit(0);
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
