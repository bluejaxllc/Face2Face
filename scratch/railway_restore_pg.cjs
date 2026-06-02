// Try to redeploy an original Postgres deployment (before the accidental app deploy)
const https = require('https');

const configPath = require('os').homedir() + '/.railway/config.json';
const config = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
const token = config.user?.token;

const environmentId = '638ea985-1d88-475a-b6f6-d7984a0563a1';

// Try the most recent REMOVED deployment (the original Postgres one)
const deploymentId = '0d52291b-2e03-443d-b760-b1239c830556';

const query = JSON.stringify({
  query: `mutation {
    deploymentRedeploy(id: "${deploymentId}") {
      id
      status
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
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(query);
req.end();
