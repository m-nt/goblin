"use strict";
const { LOGGER } = require("../utils")
const WebSocket = require('ws');
const { User, Match} = require("../models").goblin_models
const { match_controller } = require("../controllers")
const { pubClient } = require("../redis")
/**
 * @param {WebSocket} ws
 */
module.exports = (ws) => {
    // TODO: add listeners and events
    ws.on("message", (data, isBinary) => {
        let {user, error} = User.from_json(data)
        if (error) {
            ws.send(JSON.stringify(error))
            return
        }
        console.log(user);
        match_controller.add_user(user)
        ws.send(JSON.stringify(user))
    });
    ws.on("error",(err) => {
        console.log(err);
        LOGGER("Server", "Client", err, 500, 10)
    })
    ws.on("close",(code, reason) => {
        LOGGER("Server", "Client", `${reason}`, code, 10)
    })
}