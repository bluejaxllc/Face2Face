import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create blocks table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "blocks" (
        "id" serial PRIMARY KEY NOT NULL,
        "blocker_id" integer NOT NULL,
        "blocked_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now()
      );
    `);
    
    // Create reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS "reports" (
        "id" serial PRIMARY KEY NOT NULL,
        "reporter_id" integer NOT NULL,
        "reported_id" integer NOT NULL,
        "reason" text NOT NULL,
        "details" text,
        "status" text DEFAULT 'pending',
        "created_at" timestamp DEFAULT now()
      );
    `);

    // Add deleted_at column
    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
    `);

    // Create indexes if they don't exist
    await client.query(`
      CREATE INDEX IF NOT EXISTS "block_blocker_idx" ON "blocks" USING btree ("blocker_id");
      CREATE INDEX IF NOT EXISTS "block_blocked_idx" ON "blocks" USING btree ("blocked_id");
      CREATE INDEX IF NOT EXISTS "report_reporter_idx" ON "reports" USING btree ("reporter_id");
      CREATE INDEX IF NOT EXISTS "report_reported_idx" ON "reports" USING btree ("reported_id");
    `);

    await client.query('COMMIT');
    console.log('Successfully updated database schema safely.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to update schema:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
