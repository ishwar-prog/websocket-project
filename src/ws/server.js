import { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
function sendJson(socket, payload){
    if(socket.readyState !== WebSocket.OPEN) return;

    socket.send(JSON.stringify(payload));
}

function broadcast(wss, payload){
    for (const client of wss.clients){
          if(client.readyState !== WebSocket.OPEN) continue;

    client.send(JSON.stringify(payload));
    }
}

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
