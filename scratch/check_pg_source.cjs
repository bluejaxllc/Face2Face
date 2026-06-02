// Check and fix the Postgres service source — it may be linked to the app repo
const https = require('https');

const configPath = require('os').homedir() + '/.railway/config.json';
const config = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
const token = config.user.token;

const postgresServiceId = '8f280f05-9561-4fd7-87d2-faafe92295e1';

// Query the service details to see its source
const query = JSON.stringify({
  query: `query {
    service(id: "${postgresServiceId}") {
      id
      name
      templateServiceId
      icon
      repoTriggers {
        edges {
          node {
            repository
            branch
          }
        }
      }
    }
  }`
});

const options = {
  hostname: 'backboard.railway.app',
  port: 443,
  path: '/graphql/v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(query)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', JSON.stringify(JSON.parse(data), null, 2));
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(query);
req.end();
