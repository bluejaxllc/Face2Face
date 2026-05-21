
fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testu_124',
    password: 'password123',
    email: 'test_n2@example.com',
    firstName: 'Test',
    lastName: 'User',
    sex: 'male',
    age: 20
  })
}).then(r => r.json()).then(console.log).catch(console.error);
