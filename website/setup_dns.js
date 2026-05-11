const https = require('https');

const token = 'UbRvkb0VaMmoFbp1oXFqxSzmOxPjo4CQKdyoLwDf689cd8e0';

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);
    const req = https.request({ hostname: 'developers.hostinger.com', path, method, headers }, res => {
      let data = ''; res.on('data', c => data += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(data) }); } catch(e) { resolve({ status: res.statusCode, data }); } });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('=== Step 1: Get current face2face.icu DNS records ===');
  const current = await apiCall('GET', '/api/dns/v1/zones/face2face.icu');
  console.log(`Current records (HTTP ${current.status}):`);
  if (Array.isArray(current.data)) {
    for (const r of current.data) {
      console.log(`  ${r.name} [${r.type}] TTL=${r.ttl} = ${r.records.map(x => x.content).join(', ')}`);
    }
  } else {
    console.log(JSON.stringify(current.data, null, 2));
  }

  console.log('\n=== Step 2: Update DNS → Vercel ===');
  const payload = {
    overwrite: true,
    zone: [
      // Root domain A record to Vercel
      { name: "@", type: "A", ttl: 300, records: [{ content: "76.76.21.21" }] },
      // www CNAME to Vercel
      { name: "www", type: "CNAME", ttl: 300, records: [{ content: "cname.vercel-dns.com." }] }
    ]
  };

  console.log('Payload:', JSON.stringify(payload, null, 2));
  const result = await apiCall('PUT', '/api/dns/v1/zones/face2face.icu', payload);
  console.log(`HTTP ${result.status}`);
  console.log('Result:', JSON.stringify(result.data, null, 2));

  console.log('\n=== Step 3: Verify updated records ===');
  const verify = await apiCall('GET', '/api/dns/v1/zones/face2face.icu');
  if (Array.isArray(verify.data)) {
    for (const r of verify.data) {
      console.log(`  ${r.name} [${r.type}] = ${r.records.map(x => x.content).join(', ')}`);
    }
  } else {
    console.log(JSON.stringify(verify.data, null, 2));
  }

  console.log('\n✅ Done! face2face.icu now points to Vercel.');
  console.log('DNS propagation: 5-30 minutes.');
}

main().catch(e => console.error('ERROR:', e.message));
