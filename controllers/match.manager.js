const { exec } = require("child_process");
const { Match_controller } = require("./match.controllers");
const { WebSocketServer } = require("ws");
const { User, Match } = require("../models");
const { goblin_config } = require("../config");
const detectPort = require("detect-port");
class MatchManager {
    /**
     * @param {Match_controller} Mctrl
     * @param {WebSocketServer} wss
     */
    constructor(Mctrl, wss) {
        this.Mctrl = Mctrl;
        this.wss = wss;
        this.open_ports = []
        this.threshold = goblin_config.RANK_TRESHOLD;
        this.intervalIndex = 0;
        this.offline_tick_limit = goblin_config.OFFLINE_TICK_LIMMIT;
        this.fps = goblin_config.FRAME_RATE;
        (async () => {
            await this.start();
        })();
        this.intervalId = setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }
    async start() {
        for (let i = 7500; i < 8000; i++) {
            detectPort(i).then((value) => {
                if (value == i) this.open_ports.push(i)
            })
        }
        console.log("[x] - MatchMaker Starts...");
    }
    async update() {
        await this.clean_up_users();
        await this.clean_up_matches();
        // TODO try sending back user to the existing match if the reason isn't exiting
        await this.check_for_1v1_match();
        console.log(
            `all---------------mathes: ${(
                await this.Mctrl.get_all_matches()
            ).map((u) => u.muid)}`
        );
        console.log(`[${this.intervalIndex}] - MatchMaker Tick`);
        this.intervalIndex++;
    }
    /**
     * @param {Array<Number>} rank_list_1
     * @param {Array<Number>} rank_list_2
     * @
     */
    is_rank_match(rank_list_1, rank_list_2) {
        let rank_1 = Number(
            rank_list_1.reduce((a, b) => a + b, 0) / rank_list_1.length
        );
        let rank_2 = Number(
            rank_list_2.reduce((a, b) => a + b, 0) / rank_list_2.length
        );
        if (Math.abs(rank_1 - rank_2) <= this.threshold) return true;
        return false;
    }
    async check_for_1v1_match() {
        // try {
        //     let users_v_users = goblin_config.GAME_TYPE.split("v").map(u=>Number(u))
        // } catch (error) {
        //     let users_v_users = [0,0]
        // }

        // get ready users with 1v1 type
        let ready_users = (await this.Mctrl.get_all_users()).filter(
            (u) => u.state == "ready" && u.game_type == "1v1"
        );
        if (ready_users.length < 2) return;
        let match = new Match();
        let _opponents = ready_users.slice(0, 2).map((u) => u.uuid);
        // check for ranks
        if (!this.is_rank_match([ready_users[0].rank], [ready_users[1].rank]))
            return;

        ready_users.forEach((opp) => {
            opp.state = "preload";
            this.Mctrl.add_user(opp, true);
        });
        match.opponents = _opponents;

        let port = this.open_ports.pop()
        match.port = port
        this.Mctrl.add_match(match);

        // run the docker game,
        exec(
            `docker run -d -p ${port}:7777 --name match-${match.muid} ${goblin_config.SERVER_NAME}`
        );
        // send back the match properties
        let users_in_ws = await Array.from(this.wss.clients).filter((ws_u) =>
            _opponents.map((u) => u.uuid).includes(ws_u.user.uuid)
        );
        users_in_ws.forEach((ws_user) => {
            ws_user.send(JSON.stringify(match));
        });
    }
    async clean_up_matches() {
        let empty_matches = Array.from(
            await this.Mctrl.get_all_matches()
        ).filter((match) => match.opponents.length <= 0);
        empty_matches.forEach((em) => {
            this.Mctrl.remove_match(em.muid);

        });
        Array.from(await this.Mctrl.get_all_matches()).forEach((m) => {
            exec(`docker ps | grep ${m.muid}`, (error, stdout, stderr) => {
                if (!error && !stderr && stdout || error.code === 1) {
                    this.Mctrl.remove_match(m.muid);
                    this.open_ports.push(m.port)
                    exec(`docker rm -f match-${m.muid}`)
                }
            });
        });
    }
    /**
     * @returns {Array<User>}
     */
    async clean_up_users() {
        // TODO delete only offline users when there is no match for them or they exited the match
        // TODO clean up docker games wihtout users for exited reasons or offline tick limit pass , in total for a dead game
        let users_in_ws = Array.from(this.wss.clients).map(
            (ws_u) => ws_u.user.uuid
        );
        console.log(
            `all----------------users: ${Array.from(
                await this.Mctrl.get_all_users()
            ).map((u) => `${u.uuid}-${u.state}-${u.offline_counter},`)}`
        );
        console.log(
            `all--------ws------users: ${Array.from(this.wss.clients).map(
                (ws_u) => `${ws_u.user.uuid}-${ws_u.user.state},`
            )}`
        );
        let users_to_delete = (await this.Mctrl.get_all_users()).filter(
            (u) => !users_in_ws.includes(u.uuid) && u.state != "offline"
        );
        console.log(
            `all-users-to-be--deleted: ${Array.from(users_to_delete).map(
                (u) => `${u.uuid}-${u.state},`
            )}`
        );
        users_to_delete.forEach((utd) => {
            utd.state = "offline";
            this.Mctrl.add_user(utd, true);
        });
        let offline_users = (await this.Mctrl.get_all_users()).filter(
            (u) => u.state == "offline"
        );
        offline_users.forEach(async (user) => {
            if (user.offline_counter > this.offline_tick_limit) {
                await this.Mctrl.remove_user(user.uuid);
            } else {
                user.offline_counter++;
                this.Mctrl.add_user(user, true);
            }
        });
    }
}
module.exports = { MatchManager };
