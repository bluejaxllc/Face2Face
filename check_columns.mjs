import pg from 'pg';
const c = new pg.Client('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
await c.connect();
const res = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
console.log(res.rows.map(r => r.column_name));
await c.end();
