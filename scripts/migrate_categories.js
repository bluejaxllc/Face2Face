import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(databaseUrl);

async function run() {
  try {
    console.log("Adding category-specific columns to users table...");
    
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS job_title TEXT,
      ADD COLUMN IF NOT EXISTS company TEXT,
      ADD COLUMN IF NOT EXISTS industry TEXT,
      ADD COLUMN IF NOT EXISTS skills TEXT,
      ADD COLUMN IF NOT EXISTS networking_goal TEXT,
      ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
      ADD COLUMN IF NOT EXISTS vibe_status TEXT,
      ADD COLUMN IF NOT EXISTS current_activity TEXT,
      ADD COLUMN IF NOT EXISTS icebreaker TEXT,
      ADD COLUMN IF NOT EXISTS relationship_goal TEXT,
      ADD COLUMN IF NOT EXISTS love_language TEXT,
      ADD COLUMN IF NOT EXISTS mbti TEXT,
      ADD COLUMN IF NOT EXISTS perfect_date TEXT
    `;
    
    console.log("Successfully added columns.");
  } catch (err) {
    console.error("Error adding columns:", err);
  } finally {
    await sql.end();
  }
}

run();
