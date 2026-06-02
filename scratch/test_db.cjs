const postgres = require('postgres');
const sql = postgres('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');

async function test() {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log('DB Connection OK:', JSON.stringify(result));
    
    // Check if users table exists and has data
    const users = await sql`SELECT id, username, email FROM users LIMIT 5`;
    console.log('Users found:', users.length);
    users.forEach(u => console.log(`  - id=${u.id} username=${u.username} email=${u.email}`));
    
    // Check session table
    const sessions = await sql`SELECT COUNT(*) as count FROM session`;
    console.log('Sessions:', sessions[0].count);
    
    await sql.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

test();
