// Restart the Railway Postgres service via GraphQL API
const https = require('https');
const { execSync } = require('child_process');

// Get Railway token from config
const configPath = require('os').homedir() + '/.railway/config.json';
let token;
try {
  const config = JSON.parse(require('fs').readFileSync(configPath, 'utf8'));
  token = config.user?.token;
  if (!token) {
    // Try railway environment
    token = process.env.RAILWAY_TOKEN;
  }
} catch(e) {
  console.error('Could not read Railway config:', e.message);
  process.exit(1);
}

if (!token) {
  console.error('No Railway token found');
  process.exit(1);
}

console.log('Token found, length:', token.length);

const projectId = '56909d6f-a298-48d6-b6d5-8d7a1a2d3245';
const environmentId = '638ea985-1d88-475a-b6f6-d7984a0563a1';
const postgresServiceId = '8f280f05-9561-4fd7-87d2-faafe92295e1';

// First, let's query the current state
const query = JSON.stringify({
  query: `query {
    project(id: "${projectId}") {
      name
      services {
        edges {
          node {
            id
            name
            serviceInstances {
              edges {
                node {
                  serviceId
                  environmentId
                  latestDeployment {
                    id
                    status
                    canRedeploy
                  }
                }
              }
            }
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
    try {
      const result = JSON.parse(data);
      if (result.errors) {
        console.error('GraphQL Errors:', JSON.stringify(result.errors, null, 2));
      } else {
        const services = result.data.project.services.edges;
        console.log(`Project: ${result.data.project.name}`);
        console.log(`Services (${services.length}):`);
        services.forEach(({ node: svc }) => {
          console.log(`\n  ${svc.name} (${svc.id})`);
          svc.serviceInstances.edges.forEach(({ node: inst }) => {
            const dep = inst.latestDeployment;
            console.log(`    env=${inst.environmentId}`);
            console.log(`    deployment=${dep?.id} status=${dep?.status} canRedeploy=${dep?.canRedeploy}`);
          });
        });
      }
    } catch(e) {
      console.error('Parse error:', e.message, 'Raw:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(query);
req.end();
