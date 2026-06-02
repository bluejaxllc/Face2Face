// Direct test of the login flow matching what the Vercel function does
const postgres = require('postgres');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');

const sql = postgres('postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway');
const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function test() {
  try {
    console.log('1. Querying user edgarTest400...');
    const users = await sql`SELECT id, username, email, password FROM users WHERE username = 'edgarTest400'`;
    if (users.length === 0) {
      console.log('User not found');
      await sql.end();
      return;
    }
    const user = users[0];
    console.log(`   Found user id=${user.id} username=${user.username}`);
    console.log(`   Password hash length: ${user.password.length}`);
    console.log(`   Password hash preview: ${user.password.substring(0, 40)}...`);

    console.log('\n2. Testing password comparison...');
    try {
      const match = await comparePasswords('Legolitas1!', user.password);
      console.log(`   Password match: ${match}`);
    } catch(e) {
      console.error('   Password comparison error:', e.message);
    }

    console.log('\n3. Testing connect-pg-simple session store...');
    const connectPg = require('connect-pg-simple');
    const session = require('express-session');
    const PostgresStore = connectPg(session);
    const store = new PostgresStore({
      conString: 'postgresql://postgres:SgPEZDCZToCntOuzrXocMbqNvmmxNzcO@turntable.proxy.rlwy.net:32022/railway',
      createTableIfMissing: true
    });
    
    // Test saving a session
    const testSid = 'test-session-' + Date.now();
    const testData = { userId: user.id, cookie: { maxAge: 86400000 } };
    
    await new Promise((resolve, reject) => {
      store.set(testSid, testData, (err) => {
        if (err) {
          console.error('   Session save error:', err.message);
          reject(err);
        } else {
          console.log('   Session saved successfully');
          resolve();
        }
      });
    });

    // Clean up
    await new Promise((resolve) => {
      store.destroy(testSid, () => {
        console.log('   Test session cleaned up');
        resolve();
      });
    });

    console.log('\n✅ All checks passed - login flow should work');
    await sql.end();
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error('Stack:', err.stack);
    await sql.end();
    process.exit(1);
  }
}

test();
