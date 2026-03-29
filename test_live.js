async function run() {
    const baseUrl = 'https://face2face-production-11ee.up.railway.app';

    // 1. Register
    const username = 'verify_bot_' + Date.now();
    const regBody = JSON.stringify({
        username,
        email: username + '@test.com',
        password: "password123",
        firstName: "Test",
        lastName: "Bot",
        gender: "male",
        age: 25,
        selfRating: 5
    });

    const regRes = await fetch(baseUrl + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: regBody
    });

    const setCookie = regRes.headers.get('set-cookie');
    console.log('Register status:', regRes.status);

    if (!setCookie) return;

    // 2. Set Location
    const locRes = await fetch(baseUrl + '/api/users/location', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': setCookie
        },
        body: JSON.stringify({ latitude: 32.8735, longitude: -96.5305 })
    });
    console.log('Set Location status:', locRes.status);

    // 3. Set Profile Preference to "Both"
    const profRes = await fetch(baseUrl + '/api/users/profile', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': setCookie
        },
        body: JSON.stringify({ datingPreference: "both" })
    });
    console.log('Set Profile status:', profRes.status);

    // 4. Get Nearby
    const nearbyRes = await fetch(baseUrl + '/api/users/nearby', {
        headers: { 'Cookie': setCookie }
    });

    console.log('Nearby status:', nearbyRes.status);
    const data = await nearbyRes.json();
    console.log('Nearby Map Users Found:', data.length);
    if (data.length > 0) {
        console.log('Test successful! Map populated with:', data.map(u => u.username).join(', '));
    }
}
run();
