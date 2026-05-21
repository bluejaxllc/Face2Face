
import { storage } from './server/storage';
async function run() {
  try {
    const user = await storage.createUser({
      username: 'test_db_3',
      password: 'password123',
      email: 'testdb3@example.com',
      firstName: 'Test',
      lastName: 'User',
      sex: 'male',
      age: 20
    });
    console.log('Success:', user.id);
  } catch (e) {
    console.error('Error in DB:', e);
  }
}
run();
