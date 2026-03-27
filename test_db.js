import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway' });

async function run() {
    await client.connect();
    let res = await client.query(`
    UPDATE users SET latitude = '32.8745', longitude = '-96.5315', last_location = NOW() WHERE username = 'alex_test';
    UPDATE users SET latitude = '32.8725', longitude = '-96.5295', last_location = NOW() WHERE username = 'maya_test';
    UPDATE users SET latitude = '32.8755', longitude = '-96.5325', last_location = NOW() WHERE username = 'jordan_test';
    UPDATE users SET latitude = '32.8715', longitude = '-96.5285', last_location = NOW() WHERE username = 'sofia_test';
  `);
    console.log("Updated rows.");
    await client.end();
}
run();
