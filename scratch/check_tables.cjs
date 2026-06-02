const postgres = require('postgres');
const sql = postgres('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');

async function test() {
  try {
    // Check session table
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
    console.log('Tables in public schema:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    // Check session table structure
    try {
      const count = await sql`SELECT COUNT(*) as c FROM session`;
      console.log(`\nSession table exists, rows: ${count[0].c}`);
      const sample = await sql`SELECT sid, expire FROM session LIMIT 3`;
      sample.forEach(s => console.log(`  sid=${s.sid.substring(0,20)}... expire=${s.expire}`));
    } catch(e) {
      console.log('\nSession table error:', e.message);
    }

    await sql.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

test();
