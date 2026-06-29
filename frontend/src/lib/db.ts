import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'app_user',
  password: process.env.DB_PASSWORD || 'app_password',
  database: process.env.DB_NAME || 'marketplace',
});

export const db = drizzle(pool, { schema });
