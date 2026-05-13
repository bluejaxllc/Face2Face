import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function main() {
    const transport = new StdioClientTransport({
        command: process.platform === 'win32' ? 'npx.cmd' : 'npx',
        args: ['-y', 'hostinger-api-mcp@latest'],
        env: { ...process.env, API_TOKEN: 'UbRvkb0VaMmoFbp1oXFqxSzmOxPjo4CQKdyoLwDf689cd8e0' }
    });

    const client = new Client({ name: 'mcp-app', version: '1' }, { capabilities: {} });
    await client.connect(transport);

    const domain = 'face2face.icu';
    const sub = 'waitlist';

    console.log('Getting records for ' + domain + '...');
    const recordsRes = await client.callTool({
        name: 'DNS_getDNSRecordsV1',
        arguments: { domain }
    });

    const data = JSON.parse(recordsRes.content[0].text);
    const records = data.data || [];

    const existing = records.filter(r => r.name === sub || r.name === sub + '.' + domain);
    console.log('Found ' + existing.length + ' existing records for ' + sub + '.');

    for (const record of existing) {
        console.log('Deleting record: ID ' + record.id + ', Type ' + record.type + ', Name ' + record.name);
        try {
            const delRes = await client.callTool({
                name: 'DNS_deleteDNSRecordsV1',
                arguments: { domain, ids: [record.id] }
            });
            console.log('Delete result:', delRes.content[0].text);
        } catch (e) {
            console.log('Skipping delete because it failed');
        }
    }

    console.log('Creating A record for ' + sub + '...');
    const addRes = await client.callTool({
        name: 'DNS_updateDNSRecordsV1',
        arguments: {
            domain,
            zone: [{
                name: sub,
                type: 'A',
                records: [{ content: '76.76.21.21' }],
                ttl: 14400
            }]
        }
    });

    console.log('Update result:', addRes.content[0].text);

    // Close cleanly
    process.exit(0);
}

main().catch(console.error);
