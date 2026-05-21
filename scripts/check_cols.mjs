import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

await client.connect();
console.log('CONNECTED');

const r = await client.query(
  `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`
);
console.log('COLUMNS:', r.rows.map(x => x.column_name).join(', '));

// Check if missing columns exist
const cols = r.rows.map(x => x.column_name);
const missing = ['website_url', 'menu_url', 'booking_url'].filter(c => !cols.includes(c));

if (missing.length > 0) {
  console.log('MISSING COLUMNS:', missing.join(', '));
  for (const col of missing) {
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col} text`);
    console.log(`ADDED: ${col}`);
  }
} else {
  console.log('ALL COLUMNS PRESENT');
}

await client.end();
console.log('DONE');
