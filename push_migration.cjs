const fs = require('fs');
const postgres = require('postgres');
const path = require('path');
require('dotenv').config();

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: 'require' });
  
  try {
    const migrationPath = path.join(__dirname, 'migrations', '0003_careless_bloodstrike.sql');
    const queries = fs.readFileSync(migrationPath, 'utf8');
    
    console.log("Applying migration 0003_careless_bloodstrike.sql...");
    
    // Split by semicolons and filter out empty statements
    const statements = queries.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const stmt of statements) {
      console.log(`Executing: ${stmt.substring(0, 50)}...`);
      await sql.unsafe(stmt);
    }
    
    console.log("Migration applied successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await sql.end();
  }
}

run();
