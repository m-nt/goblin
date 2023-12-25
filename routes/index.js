"use strict";

const express = require('express');
const router = express.Router()

router.use("/goblin", require('./goblin.routes'))

module.exports = router