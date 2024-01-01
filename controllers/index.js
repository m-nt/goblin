"use strict";

const { Match_controller }  = require('./match.controllers')
const { MatchManager }  = require('./match.manager')
const { goblin_config } = require('../config');
/** @type {Match_controller} */
const match_controller = new Match_controller()
const matchManager = new MatchManager(match_controller, goblin_config.FRAME_RATE)

module.exports = {
    match_controller,
    matchManager
}