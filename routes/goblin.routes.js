"use strict";

const express = require('express');
const { goblin_controller } = require('../controllers');

const router = express.Router();

router.get('/', async (req, res) => {
  res.send(await goblin_controller.goblin())
})

// TODO: add routes

module.exports = router