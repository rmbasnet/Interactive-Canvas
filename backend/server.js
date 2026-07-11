const {WebSocketServer} = require('ws');

const wss = new WebSocketServer({port : 8080})

wss.on('connection', (ws)=>{
    ws.on('message', (data)=>{
        const message = JSON.parse(data);

        wss.clients.forEach((client) =>{
            if(client !== ws && client.readyState == 1){
                client.send(JSON.stringify(message))
            }
        })
    })
})

console.log('WebSocket server running on ws://localhost:8080');