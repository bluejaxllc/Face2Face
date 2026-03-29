import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: 'postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway' });

async function run() {
  await client.connect();
  try {
    const lat = 32.8735;
    const lng = -96.5305;
    const radius = 25000;

    // The EXACT query used in storage.ts right now (no NULLIF!)
    const res = await client.query(`
      SELECT id, username, dating_preference, gender, (
        3958.8 * 2 * ASIN(SQRT(
          POWER(SIN((RADIANS(CAST(latitude AS DOUBLE PRECISION)) - RADIANS(${lat})) / 2), 2) +
          COS(RADIANS(${lat})) * COS(RADIANS(CAST(latitude AS DOUBLE PRECISION))) *
          POWER(SIN((RADIANS(CAST(longitude AS DOUBLE PRECISION)) - RADIANS(${lng})) / 2), 2)
        ))
      ) as distance_miles
      FROM users
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
      AND id != 2
      AND is_active = true
      ORDER BY distance_miles ASC
      LIMIT 10
    `);
    console.log("SQL Successful! Returned users:");
    console.table(res.rows);
  } catch (err) {
    console.error("SQL Failed:", err);
  } finally {
    await client.end();
  }
}
run();
