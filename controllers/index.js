"use strict";

const { Match_controller }  = require('./goblin.controllers')

/** @type {Match_controller} */
const match_controller = new Match_controller()
module.exports = {
    match_controller
}