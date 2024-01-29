const { exec } = require("node:child_process");
const { Match_controller } = require("./match.controllers");
const { WebSocketServer } = require("ws");
const { User, Match } = require("../models");
const { goblin_config } = require("../config");
const Docker = require('dockerode');
const { LOGGER } = require("../utils");
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
        this.offline_tick_limit = goblin_config.OFFLINE_TICK_LIMMIT;
        this.fps = goblin_config.FRAME_RATE;
        this.docker = new Docker({socketPath: '/var/run/docker.sock'}); 
        // this.docker = new Docker(); 
        (async () => {
            await this.start();
        })();
        this.intervalId = setInterval(() => {
            this.update();
        }, 1000 / this.fps);
    }
    /**
     *
     * @param {string} command
     */
    async async_exec(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                resolve({ error, stdout, stderr });
            });
        });
    }
    async start() {
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
    /**
     * 
     * @param {string} name
     * @param {string} image
     * @param {string} port
     * @returns { Promise<{error: any, container: Docker.Container, inspect: Docker.ContainerInspectInfo}> }
     */
    async create_docker(name,image,port) {
        return new Promise((resolve, reject) => {
            let _port = {}
            _port[port] = {}
            this.docker.createContainer({
            AttachStderr: false,
            AttachStdin: true,
            AttachStdout: true,
            Image: image,
            name: name,
            ExposedPorts: _port,
            HostConfig: {
                PublishAllPorts: true,
            },
            }, async (error, container) => {
                let inspect = undefined
                if (container) {
                    container.start()
                    while (true) {
                        let _inspect = await container.inspect()
                        if (_inspect?.NetworkSettings?.Ports[port]) {
                            inspect = _inspect;
                            break;
                        }
                    }
                }
                resolve({error, container, inspect})
            })})
    }
    /**
     * 
     * @param {string} name
     * @returns { Promise<Docker.ContainerInfo | undefined> }
     */
    async find_container(name) {
        return new Promise(async (resolve, reject) => {
            let cont = (await this.docker.listContainers()).filter(
                c=>c.Names.includes(`/${name}`)
            )
            if (cont.length>0)
                resolve(cont[0])
            resolve(undefined)
        })
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

        // run the docker game,
        let { error, container, inspect } = await this.create_docker(
            `match-${match.muid}`,
            `${goblin_config.SERVER_NAME}`,
            `${goblin_config.SERVER_PORT}`
        )
        if (error) {
            LOGGER("server", "client", error, 500, 30)
            return;
        }
        let port = inspect.NetworkSettings.Ports[`${goblin_config.SERVER_PORT}`][0]?.HostPort
        ready_users.forEach((opp) => {
            opp.state = "ingame";
            this.Mctrl.add_user(opp, true);
        });
        match.opponents = _opponents;

        match.port = port;
        this.Mctrl.add_match(match);
        // send back the match properties
        let users_in_ws = Array.from(this.wss.clients).filter((ws_u) =>
            _opponents.includes(ws_u.user.uuid)
        );
        users_in_ws.forEach((ws_user) => {
            ws_user.send(JSON.stringify(match));
        });
    }
    async clean_up_matches() {
        let empty_matches = Array.from(
            await this.Mctrl.get_all_matches()
        ).filter((match) => match.opponents.length <= 0);
        empty_matches.forEach(async (em) => {
            this.Mctrl.remove_match(em.muid);
            let match_cont = await this.find_container(`${this.Mctrl._matches_key_prefix}${em.muid}`)
            if (!match_cont) return
            this.docker.getContainer(match_cont.Id).remove({
                force:true
            })
        });
        Array.from(await this.Mctrl.get_all_matches()).forEach(async (m) => {
            let result = await this.find_container(`${this.Mctrl._matches_key_prefix}${m.muid}`)
            if (!result) {
                this.Mctrl.remove_match(m.muid);
                return
            }
            let state = result.State
            let port = result.Ports[0].PublicPort
            if (!["exited", "dead"].includes(state) || port == m.port) return
            this.docker.getContainer(result.Id).remove({
                force:true
            })
            this.Mctrl.remove_match(m.muid);
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
