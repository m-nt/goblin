"use strict";

const { Match_controller }  = require('./match.controllers')
const { MatchManager }  = require('./match.manager')
const { wss } = require("../goblin")
/** @type {Match_controller} */
const match_controller = new Match_controller()

const matchManager = new MatchManager(match_controller, wss)

module.exports = {
    match_controller,
    matchManager,
    MatchManager,
    Match_controller
}