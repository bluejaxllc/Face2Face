import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

const c = new pg.Client('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
await c.connect();

const password = 'face2face';
const hashed = await hashPassword(password);

// Reset password for Test1 (id=1)
await c.query('UPDATE users SET password = $1 WHERE username = $2', [hashed, 'Test1']);
console.log('Reset password for Test1');

// Also create a fresh clean test account
const existing = await c.query("SELECT id FROM users WHERE username = 'edgar_test'");
if (existing.rows.length === 0) {
  const hash2 = await hashPassword('face2face');
  await c.query(
    `INSERT INTO users (username, email, password, first_name, last_name, gender, age, self_rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    ['edgar_test', 'edgar@face2face.icu', hash2, 'Edgar', 'Tester', 'male', 25, 8]
  );
  console.log('Created fresh account: edgar_test');
} else {
  await c.query('UPDATE users SET password = $1 WHERE username = $2', [await hashPassword('face2face'), 'edgar_test']);
  console.log('Reset password for edgar_test');
}

console.log('\n=== LOGIN CREDENTIALS ===');
console.log('Account 1: username=Test1, password=face2face');
console.log('Account 2: username=edgar_test, password=face2face');

c.end();
