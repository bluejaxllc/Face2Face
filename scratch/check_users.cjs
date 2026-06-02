const postgres = require('postgres');
const sql = postgres('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');

async function test() {
  try {
    // Check for user 'edgar'
    const edgar = await sql`SELECT id, username, email, password FROM users WHERE username = 'edgar' OR email LIKE '%edgar%'`;
    console.log('Edgar users:', edgar.length);
    edgar.forEach(u => console.log(`  id=${u.id} username=${u.username} email=${u.email} hasPassword=${!!u.password} pwLen=${u.password?.length}`));

    // List all usernames
    const all = await sql`SELECT id, username, email FROM users ORDER BY id`;
    console.log('\nAll users:');
    all.forEach(u => console.log(`  id=${u.id} username=${u.username} email=${u.email}`));

    await sql.end();
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

test();
