// Query all deployments for the Postgres service to find the original working one
const https = require('https');

const configPath = require('os').homedir() + '/.railway/config.json';
const config = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
const token = config.user?.token;

const environmentId = '638ea985-1d88-475a-b6f6-d7984a0563a1';
const postgresServiceId = '8f280f05-9561-4fd7-87d2-faafe92295e1';

const query = JSON.stringify({
  query: `query {
    deployments(
      input: {
        environmentId: "${environmentId}"
        serviceId: "${postgresServiceId}"
      }
      first: 10
    ) {
      edges {
        node {
          id
          status
          createdAt
          canRedeploy
          staticUrl
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
    try {
      const result = JSON.parse(data);
      if (result.errors) {
        console.error('Errors:', JSON.stringify(result.errors, null, 2));
        return;
      }
      const deps = result.data.deployments.edges;
      console.log(`Postgres deployments (${deps.length}):\n`);
      deps.forEach(({ node: d }) => {
        console.log(`  ID: ${d.id}`);
        console.log(`  Status: ${d.status}`);
        console.log(`  Created: ${d.createdAt}`);
        console.log(`  CanRedeploy: ${d.canRedeploy}`);
        console.log(`  Source Image: ${d.source?.image || 'none'}`);
        console.log(`  Source Repo: ${d.source?.repo || 'none'}`);
        console.log('');
      });
    } catch(e) {
      console.error('Parse error:', e.message, data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(query);
req.end();
