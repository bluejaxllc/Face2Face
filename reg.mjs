
fetch('https://face2face-production-11ee.up.railway.app/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'BlueJaxBot',
    password: 'password123',
    email: 'bluejaxbot@example.com',
    firstName: 'BlueJax',
    lastName: 'Bot',
    age: 25,
    selfRating: 8
  })
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
}).catch(console.error);

