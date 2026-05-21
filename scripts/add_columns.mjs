import pkg from 'pg';
const { Client } = pkg;

async function run() {
  console.log("Starting column addition script...");
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log("Connected to database.");

    const columns = [
      { name: 'website_url', type: 'text' },
      { name: 'menu_url', type: 'text' },
      { name: 'booking_url', type: 'text' }
    ];

    for (const col of columns) {
      console.log(`Adding column ${col.name}...`);
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col.name} ${col.type};`);
        console.log(`Column ${col.name} handled.`);
      } catch (err) {
        console.error(`Error adding ${col.name}:`, err.message);
      }
    }

    console.log("Script completed.");
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await client.end();
  }
}

run();
