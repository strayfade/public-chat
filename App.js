const express = require('express');
const http = require('http');
const WebSocket = require('ws');

// Create an instance of Express
const app = express();

// Create an HTTP server using Express
const Server = http.createServer(app);

// Create a WebSocket server attached to the HTTP server
const WebsocketServer = new WebSocket.Server({ port: 23828 })

// Middleware to serve static files (e.g., HTML)
app.use(express.static('public'));

const path = require('path')
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"))
})

const fs = require('fs').promises
const DataPath = path.join(__dirname, "messages.bin")
const bcrypt = require('bcrypt');
const salt = `$2b$10$YMjaZDiSN0CD8VKgRkjete`
const SaveMessage = async (Message) => {
    await fs.appendFile(DataPath, Message, { encoding: "utf-8" })
}
const GetAllMessages = async () => {
    return await fs.readFile(DataPath, { encoding: "utf-8" })
}

WebsocketServer.on('connection', async (Websocket, Request) => {
    Websocket.on('message', async (Message) => {
        if (Message.toString() == `\u0000`) {
            Websocket.send(await GetAllMessages())
        }
        else {
            let hash = (await bcrypt.hash(Request.socket.remoteAddress, salt))
            hash = hash.toString().substring(hash.length - 10, hash.length)
            Message = `\u0000[${hash}] ${Message.toString()}`
            SaveMessage(Message)
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

if (process.argv[2])
    Server.listen(process.argv[2])
else if (process.env.PORT)
    Server.listen(process.env.PORT)
else 
    Server.listen(3000)