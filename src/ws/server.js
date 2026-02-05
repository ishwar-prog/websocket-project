import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
/**
 * Send a JSON-serializable payload over a WebSocket if the socket is open.
 * @param {WebSocket} socket - The WebSocket to send the payload through.
 * @param {*} payload - The value to serialize to JSON and send; must be JSON-serializable.
 */
function sendJson(socket, payload){
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

/**
 * Broadcasts a JSON-serializable payload to all open clients of a WebSocketServer.
 * @param {import('ws').WebSocketServer} wss - The WebSocket server whose connected clients will receive the payload.
 * @param {*} payload - The value to serialize to JSON and send to each open client.
 */
function broadcast(wss, payload){
    for (const client of wss.clients){
          if(client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
    }
}

/**
 * Attach a WebSocket server at path "/ws" to an existing HTTP server and expose a helper to broadcast match creation events.
 *
 * @param {import('http').Server} server - The HTTP server instance to bind the WebSocketServer to.
 * @returns {{ broadcastMatchCreated: (match: any) => void }} An object with a `broadcastMatchCreated` function that, when called with a match object, broadcasts a `{ type: 'match_created', data: match }` payload to all connected clients.
 */
export function attachSocketServer(server){
    const wss = new WebSocketServer({ server,path:'/ws',maxPayload: 1024 * 1024 });

    wss.on('connection',(socket)=>{
        console.log('Client connected to WebSocket');
        sendJson(socket,{type:'welcome'});

        socket.on('message',(data)=>{
            console.log('Received message:',data.toString());
        });

        socket.on('error',console.error);

        socket.on('close',()=>{
            console.log('Client disconnected from WebSocket');
        });
    });

    function broadcastMatchCreated(match){
        broadcast(wss,{type:'match_created',data:match});
    }
    return { broadcastMatchCreated }
}