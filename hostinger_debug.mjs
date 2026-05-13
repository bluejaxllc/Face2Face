import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fs from 'fs';

async function main() {
    const transport = new StdioClientTransport({
        command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
        args: ['-y', 'hostinger-api-mcp@latest'],
        env: { ...process.env, API_TOKEN: 'UbRvkb0VaMmoFbp1oXFqxSzmOxPjo4CQKdyoLwDf689cd8e0' }
    });

    const client = new Client({ name: 'mcp-app', version: '1' }, { capabilities: {} });
    await client.connect(transport);

    const domain = 'face2face.icu';

    console.log('Getting records for ' + domain + '...');
    const recordsRes = await client.callTool({
        name: 'DNS_getDNSRecordsV1',
        arguments: { domain }
    });

    const data = JSON.parse(recordsRes.content[0].text);
    fs.writeFileSync('c:/Users/edgar/OneDrive/Desktop/Face 2 Face/hostinger_dns.json', JSON.stringify(data, null, 2));
    console.log('Written to hostinger_dns.json');

    // Close cleanly
    process.exit(0);
}

main().catch(console.error);
