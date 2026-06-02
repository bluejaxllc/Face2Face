const postgres = require('postgres');
const sql = postgres('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');

async function main() {
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position`;
  console.log('Current users table columns:');
  cols.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));
  await sql.end();
}
main().catch(e => { console.error(e); process.exit(1); });
