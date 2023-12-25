"use strict";

const express = require('express');
const app = express();
const http_server = require('http').createServer(app);

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
const { WebSocketServer } = require('ws');
const WebSocket = require('ws');

const websocket = new WebSocketServer({server:http_server})
// socket connection event handlers
/**
 * 
 * @param {WebSocket} ws
 */
const onConnection = (ws) => {
    require('./socket').user_events(ws);
}
websocket.on("connection", onConnection);

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
