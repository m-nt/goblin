"use strict";
const { FROM_ENV } = require("../utils").usefull_functions;

module.exports = {
    DATABASE_URL: FROM_ENV("mongodb://localhost:27017", "MONGO_URL"),
    DATABASE_NAME: "booklet-service",
    REDIS_URL: "redis://localhost:6379",
    REDIS_HOST: "localhost",
    REDIS_PORT: FROM_ENV(6379, "REDIS_PORT_6379_TCP_PORT"),
};