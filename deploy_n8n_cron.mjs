const N8N_HOST = 'http://localhost:5678';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwNmU4YmNhMS1jYmI3LTQ0YTQtOTE3Yy1lZTFjMzg5NTA3YjIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiOGUyMDk3ZmEtN2RmZS00MTIyLTliZjctYTAwYmZlNWVhNWZhIiwiaWF0IjoxNzc4MTI0MjQ0fQ.UmI6nYc2PkZ0bMfDdEAYM6mKNDnrYk-ZykNTLIUIj7I';

const workflowJson = {
  name: 'Face 2 Face - Weekly Leaderboard Reset',
  nodes: [
    {
      parameters: {
        rule: {
          interval: [
            {
              field: 'cronExpression',
              expression: '0 0 * * 1' // Every Monday at 12:00 AM
            }
          ]
        }
      },
      name: 'Schedule Trigger',
      type: 'n8n-nodes-base.scheduleTrigger',
      typeVersion: 1.1,
      position: [250, 300]
    },
    {
      parameters: {
        method: 'POST',
        url: 'https://face2face-production-11ee.up.railway.app/api/admin/reset-weekly-miles',
        sendBody: false,
        specifyHeaders: true,
        headerParameters: {
          parameters: [
            {
              name: 'Content-Type',
              value: 'application/json'
            }
          ]
        },
        options: {}
      },
      name: 'HTTP Request',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.1,
      position: [450, 300]
    }
  ],
  connections: {
    'Schedule Trigger': {
      main: [
        [
          {
            node: 'HTTP Request',
            type: 'main',
            index: 0
          }
        ]
      ]
    }
  },
  settings: {}
};

async function deploy() {
  try {
    console.log('Sending workflow to n8n...');
    const res = await fetch(`${N8N_HOST}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowJson)
    });

    if (!res.ok) {
      let errText = await res.text();
      try { errText = JSON.parse(errText); } catch {}
      throw new Error(`Failed to create workflow: ${res.status} ${JSON.stringify(errText)}`);
    }

    const result = await res.json();
    console.log('Workflow created with ID:', result.id);

    console.log('Activating workflow...');
    const actRes = await fetch(`${N8N_HOST}/api/v1/workflows/${result.id}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (!actRes.ok) {
      const err = await actRes.text();
      throw new Error(`Failed to activate: ${actRes.status} ${err}`);
    }
    
    console.log('✅ Cron job successfully deployed and activated in n8n!');
  } catch (err) {
    if (err.message) {
      console.log('DEPLOY_ERROR: ' + err.message);
    } else {
      console.log('DEPLOY_ERROR: ' + err);
    }
  }
}

deploy();
