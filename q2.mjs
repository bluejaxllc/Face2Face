import pg from 'pg';
import fs from 'fs';
const c = new pg.Client('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
c.connect().then(async () => {
  const res = await c.query('SELECT username, password FROM users LIMIT 10');
  fs.writeFileSync('db_out.json', JSON.stringify(res.rows, null, 2), 'utf8');
  c.end();
}).catch(console.error);
