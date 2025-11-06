// Load environment variables for tests
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.test if it exists, otherwise from .env
dotenv.config({
  path: join(__dirname, '.env.test')
});

// Set default test values for required environment variables
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '3000';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// Set test database URL if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/testdb';
}
