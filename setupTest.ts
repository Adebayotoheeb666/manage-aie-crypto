import { beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4NjYwNTY5OX0.EGIM96RAZx35lBzdJ'
);

// Read the initial schema
const schemaPath = path.join(process.cwd(), 'supabase', 'migrations', '001_initial_schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Function to execute SQL statements
async function executeSql(statements: string[]) {
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        const { error } = await supabase.rpc('pg_temp.execute_sql', { sql: statement });
        if (error) {
          console.warn('Error executing statement:', error.message);
        }
      } catch (error) {
        console.warn('Error executing statement:', error);
      }
    }
  }
}

// Setup test database before all tests
beforeAll(async () => {
  console.log('Setting up test database...');
  
  try {
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Execute each statement
    await executeSql(statements);
    console.log('Test database setup completed');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}, 30000); // 30 second timeout for setup
