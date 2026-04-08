const pg = require('pg');
const fs = require('fs');
const c = new pg.Client('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
c.connect().then(() => c.query('SELECT id, username, first_name, last_name, gender FROM users ORDER BY id'))
  .then(r => {
    const lines = r.rows.map(u => `ID:${u.id} | ${u.username} | ${u.first_name} ${u.last_name} | ${u.gender}`);
    fs.writeFileSync('users_list.txt', lines.join('\n'), 'utf8');
    console.log('Done: ' + r.rows.length + ' users');
    c.end();
  })
  .catch(e => { console.error(e); c.end(); });
