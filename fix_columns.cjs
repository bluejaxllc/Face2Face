const { Client } = require('pg');
const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway';

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    const queries = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS portfolio_url text;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_motto text;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS weekend_vibe text;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS social_battery text;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS lifestyle_coffee text;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS lifestyle_alcohol text;',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS lifestyle_schedule text;'
    ];
    for (const q of queries) {
      await client.query(q);
      console.log('Executed:', q);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

run();
