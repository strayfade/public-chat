const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Create an instance of Express
const app = express();

// Create an HTTP server using Express
const Server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server
const WebsocketServer = new WebSocket.Server({ server: Server });

// Middleware to serve static files (e.g., HTML)
app.use(express.static('public'));

const path = require('path')
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})

const fs = require('fs').promises
const DataPath = path.join(__dirname, "messages.bin")
const SaveMessage = async (Message) => {
    await fs.appendFile(DataPath, `\u0000${Message}`, { encoding: "utf-8" })
}
const GetAllMessages = async () => {
    return await fs.readFile(DataPath, { encoding: "utf-8" })
}

WebsocketServer.on('connection', async (Websocket) => {
    Websocket.on('message', async (Message) => {
        if (Message.toString() == `\u0000`) {
            Websocket.send(await GetAllMessages())
        }
        else {
            SaveMessage(Message.toString())
            WebsocketServer.clients.forEach(Client => {
                if (Client.readyState === WebSocket.OPEN) {
                    Client.send(Message.toString());
                }
            });
        }
    });
    Websocket.on('close', () => {
        
    });
});

Server.listen(3000, () => {
    console.log('Server is listening on http://localhost:3000');
});
