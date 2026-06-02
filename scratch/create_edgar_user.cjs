// Create a fresh user with known password for testing
const postgres = require('postgres');
const { scrypt, randomBytes } = require('crypto');
const { promisify } = require('util');

const sql = postgres('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  const username = 'edgar';
  const email = 'edgar@bluejax.ai';
  const password = 'Legolitas1!';

  // Check if user already exists
  const existing = await sql`SELECT id FROM users WHERE username = ${username} OR email = ${email}`;
  if (existing.length > 0) {
    // Update password
    const hashed = await hashPassword(password);
    await sql`UPDATE users SET password = ${hashed} WHERE id = ${existing[0].id}`;
    console.log(`Updated password for existing user id=${existing[0].id}`);
  } else {
    // Create new user
    const hashed = await hashPassword(password);
    const result = await sql`INSERT INTO users (username, email, password, age, first_name, last_name) VALUES (${username}, ${email}, ${hashed}, 25, 'Edgar', 'BlueJax') RETURNING id`;
    console.log(`Created user id=${result[0].id} username=${username}`);
  }

  console.log(`\nCredentials:`);
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
