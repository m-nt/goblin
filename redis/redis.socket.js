"use strict";

const { createClient } = require("redis");
const { database_config } = require("../config");
const pubClient = createClient({
    url: database_config.REDIS_URL,
});
// const { Socket } = require("socket.io");
const subClient = pubClient.duplicate();
// connecting to redis server
subClient.connect();
pubClient.connect();

// redis client error handler
pubClient.on("error", (err) => {
    throw new Error(err);
});
subClient.on("error", (err) => {
    console.log(err.message);
});

// redis subscription client
(async () => {
    subClient.subscribe("hello", async (data) => {
        console.log("hi");
    });
    subClient.subscribe("ops", (data) => {
        let _data = JSON.parse(data);
        console.log(_data);
    });
})();

module.exports = {
    pubClient,
    subClient,
};