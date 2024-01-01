"use strict";
const { LOGGER } = require("../utils")
const WebSocket = require('ws');
const { User, Match, WSData} = require("../models").goblin_models
const { match_controller } = require("../controllers")
const { pubClient } = require("../redis")
/**
 * @param {WebSocket} ws
 */
module.exports = (ws) => {
    // TODO: add listeners and events
    ws.send("hi")
    ws.on("message", async (data, isBinary) => {
        let {wsdata, error} = WSData.from_json(data)
        if (error) {
            ws.send(JSON.stringify(error))
            return
        }
        ws.emit(wsdata.action,wsdata.data)
    });
    ws.on("error",(err) => {
        console.log(err);
        LOGGER("Server", "Client", err, 500, 10)
    })
    ws.on("close",(code, reason) => {
        LOGGER("Server", "Client", `${reason}`, code, 10)
    })
    ws.on("add:user", (data) => {
        let {user, error} = User.from_json(data)
        if (error) {
            ws.send(JSON.stringify(error))
            return
        }
        match_controller.add_user(user)
        setTimeout(async () => {
        let users = await match_controller.get_all_users()
        ws.send(JSON.stringify(users))
        },1000)
    })
}