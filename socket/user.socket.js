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
    
    ws.onerror = async (err) => {
        const user = ws?.user
        LOGGER("Server", "Client", err, 500, 10)
        if (user) {
            user.state = "offline"
            match_controller.add_user(user,true)
            let all_matches = []
            try {
                all_matches = await match_controller.get_all_matches()
            } catch (error) {
            LOGGER("Server", "Client", err, 500, 10)
            }
            all_matches.forEach(m => {
                if (m.opponents.includes(user.uuid)) {
                    let index = m.opponents.indexOf(user.uuid)
                    m.opponents.splice(index, 1)
                    match_controller.add_match(m,true)
                }
            })
        }
    }
    ws.onclose = async (code, reason) => {
        const user = ws?.user
        LOGGER("Client", user, `closed by server for '${reason}'`, code, 10)
        if (user) {
            user.state = "offline"
            match_controller.add_user(user, true)
            let all_matches = []
            try {
                all_matches = await match_controller.get_all_matches()
            } catch (error) {
                LOGGER("Server", "Client", err, 500, 10)
            }
            all_matches.forEach(m => {
                if (m.opponents.includes(user.uuid)) {
                    let index = m.opponents.indexOf(user.uuid)
                    m.opponents.splice(index, 1)
                    match_controller.add_match(m,true)
                }
            })
        }
    }
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