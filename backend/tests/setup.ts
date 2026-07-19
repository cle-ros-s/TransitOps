import dotenv from 'dotenv';
import path from 'path';

// Load test environment before any imports
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
