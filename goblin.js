"use strict";

const express = require('express');
const app = express();
const http_server = require('http').createServer(app);
const { LOGGER } = require('./utils');
const { User } = require('./models');
// Loading configs from environment variables if available
require('./utils').usefull_functions.LOAD_CONFIG()
const { goblin_config, socket_config } = require('./config')
// Default CORS middleware
const cors = require('cors')
var corsOptions = {
    origin: socket_config.CORS,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions))

// ws server
const { WebSocketServer, WebSocket } = require('ws');
const wss = new WebSocketServer({noServer:true})
http_server.on("upgrade", (req, socket, head) => {
    socket.on("error", (err) => {
        LOGGER("Server", req.headers?.uuid, err.message, 500, 10)
    })
    // Auth part
    if (req.headers?.token != "1") {
        socket.write(`HTTP/1.1 401 Unauthorized access!\r\n\r\n`)
        socket.destroy({ message: "HTTP/1.1 401 Unauthorized access!" })
        return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
        let {user, error} = User.from_json({ uuid: req.headers?.uuid, rank: Number(req.headers?.rank) })
        if (error) {
            socket.write(`HTTP/1.1 404 Couldn't ${JSON.stringify(error)}\r\n\r\n`)
            socket.destroy({ message: `HTTP/1.1 ${JSON.stringify(error)}` })
            return
        }
        ws.user = user
        wss.emit("connection",ws,req)
    })
})
// socket connection event handlers
/**
 * 
 * @param {WebSocket} ws
 */
const onConnection = (ws) => {
    require('./socket').user_events(ws, wss);
}
wss.on("connection", onConnection);
module.exports = {
    wss
}
// service health check
app.get('/readness', (req, res) => {
    res.send('ok')
})
app.get('/liveness', (req, res) => {
    res.send('ok')
})

// json parser middleware
app.use(express.json());

// application routes
if (goblin_config.ENV === 'prod')
{
    app.use('/api/v1', require('./routes'))
    http_server.listen(goblin_config.PORT);
}
else
{
    app.use(require('./routes'))
    http_server.listen(goblin_config.PORT, () => { console.log(`listening on ${goblin_config.PORT}`) });
}
