import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4NjYwNTY5OX0.EGIM96RAZx35lBzdJ'
);

async function setupTestDatabase() {
  try {
    console.log('Setting up test database...');

    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split into individual statements and execute each one
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement) {
        try {
          console.log(`Executing: ${statement.substring(0, 100)}...`);
          const { error } = await supabase.rpc('pg_temp.execute_sql', { sql: statement });
          if (error) {
            console.warn('Error executing statement:', error.message);
          }
        } catch (err) {
          console.warn('Error executing statement:', err);
        }
      }
    }

    console.log('Test database setup completed');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

// Run the setup
setupTestDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to set up test database:', error);
    process.exit(1);
  });
