import { WebSocket, WebSocketServer } from 'ws';
import type { Server } from 'http';
import { log } from './log';

// Map to keep track of connected users: userId -> WebSocket
const connectedUsers = new Map<number, WebSocket>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // We expect the client to send an authentication message right after connecting
    let userId: number | null = null;
    let isAlive = true;

    ws.on('pong', () => {
      isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'AUTH') {
          if (typeof message.userId === 'number') {
            userId = message.userId;
            connectedUsers.set(userId, ws);
            log(`WebSocket connected for user ${userId}`);
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
          }
        }
      } catch (err) {
        log(`WebSocket message parse error: ${err}`);
      }
    });

    ws.on('close', () => {
      if (userId) {
        connectedUsers.delete(userId);
        log(`WebSocket disconnected for user ${userId}`);
      }
    });
    
    // Cleanup broken connections
    const interval = setInterval(() => {
      if (isAlive === false) return ws.terminate();
      isAlive = false;
      ws.ping();
    }, 30000);

    ws.on('close', () => clearInterval(interval));
  });

  log('WebSocket server initialized on /ws');
}

/**
 * Push an event to a specific connected user
 */
export function notifyUser(userId: number, event: string, payload: any = {}) {
  const ws = connectedUsers.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: event, payload }));
  }
}
