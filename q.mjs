
import pg from 'pg';
const c = new pg.Client('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
c.connect().then(async () => {
  const res = await c.query('SELECT username, password FROM users LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  c.end();
}).catch(console.error);

