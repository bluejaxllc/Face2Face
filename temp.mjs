
import pg from 'pg';
const c = new pg.Client('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
c.connect().then(async () => {
  const res = await c.query('SELECT * FROM users LIMIT 1');
  console.log(Object.keys(res.rows[0]));
  c.end();
}).catch(console.error);

