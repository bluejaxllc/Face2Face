import pg from 'pg';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return buf.toString('hex') + '.' + salt;
}

const c = new pg.Client('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
c.connect().then(async () => {
  const hash = await hashPassword('password123');
  await c.query('UPDATE users SET password = $1 WHERE username = $2', [hash, 'admin']);
  console.log('Password for admin reset to password123');
  c.end();
}).catch(console.error);
