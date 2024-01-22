"use strict";
const { pubClient } = require("../redis");
const { LOGGER } = require("../utils")
const {WebSocketServer, WebSocket} = require('ws');
const { User, Match, WSData} = require("../models")
const {match_controller} = require('../controllers');
/**
 * @param {WebSocket} ws
 * @param {WebSocketServer} wss
 */
module.exports = (ws, wss) => {
    // Initial on connection setups
    match_controller.add_user(ws.user, true)
    // TODO: add listeners and events
    ws.send("hi")
    ws.on("message", async (data, isBinary) => {
        let {wsdata, error} = WSData.from_json(data.toString())
        if (error) {
            LOGGER("Server", JSON.stringify(ws?.user), error.message, error.index, 10)
            ws.send(JSON.stringify(error))
            return
        }
        ws.emit(wsdata.action)
    });
    
    ws.on("error",async (err) => {
        LOGGER("Server", "Client", err, 500, 10)
        if (ws?.user) {
            ws.user.state = "offline"
            match_controller.add_user(ws.user,true)
            (async () => {
                (await match_controller.get_all_matches()).forEach(m => {
                    if (m.opponents.includes(ws.user.uuid)) {
                        let index = m.opponents.indexOf(ws.user.uuid)
                        m.opponents.splice(index,1)
                    }
                })
            })()
            delete ws?.user
        }
    })
    ws.on("close",async (code, reason) => {
        LOGGER("Client", ws?.user.uuid, `closed by server for '${reason}'`, code, 10)
        if (ws?.user) {
            ws.user.state = "offline"
            console.log(ws.user);
            match_controller.add_user(ws.user, true)
            (await match_controller.get_all_matches()).forEach(m => {
                if (m.opponents.includes(ws.user.uuid)) {
                    let index = m.opponents.indexOf(ws.user.uuid)
                    m.opponents.splice(index, 1)
                }
            })
            delete ws?.user
        }
    })
    ws.on("ready", async () => {
        let {user, error} = User.validate(ws.user)
        if (error) {
            ws.send(JSON.stringify(error))
            return
        }
        let _user = await match_controller.loadUserAsync(user.uuid)
        if (!_user) return
        _user.state = "ready"
        match_controller.add_user(_user,true)
    })
}