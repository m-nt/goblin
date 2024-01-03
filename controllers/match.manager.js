const { Match_controller } = require("./match.controllers");
const { WebSocketServer } = require('ws');
const { User, Match } = require('../models');
const { goblin_config } = require("../config");
class MatchManager {
    /**
     * @param {Match_controller} Mctrl
     * @param {WebSocketServer} wss
     */
    constructor(Mctrl, wss) {
        this.Mctrl = Mctrl;
        this.wss = wss;
        this.threshold = goblin_config.RANK_TRESHOLD;
        this.intervalIndex = 0;
        this.offline_tick_limit = goblin_config.OFFLINE_TICK_LIMMIT
        this.fps = goblin_config.FRAME_RATE;
        (async () => {
            await this.start();
        })();
        this.intervalId = setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }
    async start() {
        console.log("[x] - MatchMaker Starts...");
    }
    async update() {
        await this.clean_up_users()
        // TODO try sending back user to the existing match if the reason isn't exiting
        await this.check_for_1v1_match()
        console.log(`all---------------mathes: ${(await this.Mctrl.get_all_matches()).map(u=>u.muid)}`);
        console.log(`[${this.intervalIndex}] - MatchMaker Tick`);
        this.intervalIndex++;
    }
    /**
     * @param {Array<Number>} rank_list_1
     * @param {Array<Number>} rank_list_2
     * @
     */
    is_rank_match(rank_list_1, rank_list_2) {
        let rank_1 = Number(rank_list_1.reduce((a, b) => a + b, 0)/rank_list_1.length)
        let rank_2 = Number(rank_list_2.reduce((a, b) => a + b, 0) / rank_list_2.length)
        if (Math.abs(rank_1 - rank_2) <= this.threshold) return true
        return false
    }
    async check_for_1v1_match() {
        // try {
        //     let users_v_users = goblin_config.GAME_TYPE.split("v").map(u=>Number(u))
        // } catch (error) {
        //     let users_v_users = [0,0]
        // }

        // get ready users with 1v1 type
        let ready_users = (await this.Mctrl.get_all_users()).filter(u=>u.state == "ready" && u.game_type == "1v1")
        if (ready_users.length < 2) return
        let match = new Match()
        let _opponents = ready_users.slice(0, 2)
        // check for ranks
        if (!this.is_rank_match([_opponents[0].rank], [_opponents[1].rank])) return

        _opponents.forEach(opp => {
            opp.state = "preload"
            this.Mctrl.add_user(opp,true)
        })
        match.opponents = _opponents
        this.Mctrl.add_match(match)
        // run the docker game,

        // send back the match properties
        let users_in_ws = await Array.from(this.wss.clients).filter(ws_u=>_opponents.map(u=>u.uuid).includes(ws_u.user.uuid))
        users_in_ws.forEach(ws_user => {
            ws_user.send(JSON.stringify(match))
        })
    }
    /**
     * @returns {Array<User>}
     */
    async clean_up_users() {
        // TODO delete only offline users when there is no match for them or they exited the match
        // TODO clean up docker games wihtout users for exited reasons or offline tick limit pass , in total for a dead game
        let users_in_ws = Array.from(this.wss.clients).map((ws_u)=> ws_u.user.uuid )
        console.log(`all----------------users: ${Array.from(await this.Mctrl.get_all_users()).map(u=>`${u.uuid}-${u.state}-${u.offline_counter},`)}`);
        console.log(`all--------ws------users: ${Array.from(this.wss.clients).map((ws_u)=> `${ws_u.user.uuid}-${ws_u.user.state},`)}`);
        let users_to_delete = (await this.Mctrl.get_all_users()).filter(u=>!users_in_ws.includes(u.uuid) && u.state != "offline");
        console.log(`all-users-to-be--deleted: ${Array.from(users_to_delete).map(u=>`${u.uuid}-${u.state},`)}`);
        users_to_delete.forEach(utd => {
            utd.state = "offline"
            this.Mctrl.add_user(utd, true)
        })
        let offline_users = (await this.Mctrl.get_all_users()).filter(u => u.state == "offline")
        offline_users.forEach(async user => {
            if (user.offline_counter > this.offline_tick_limit) {
                await this.Mctrl.remove_user(user.uuid)
            } else {
                user.offline_counter++;
                this.Mctrl.add_user(user,true)
            }
        })
    }
}
module.exports = { MatchManager };
