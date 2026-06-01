const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL + "?sslmode=disable",
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB");
    
    await client.query(`ALTER TABLE "users" ADD COLUMN "xp" integer DEFAULT 0;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN "level" integer DEFAULT 1;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN "current_streak" integer DEFAULT 0;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN "longest_streak" integer DEFAULT 0;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN "last_login_date" timestamp;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN "badges" text;`);
    
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await client.end();
  }
}

run();
