"use strict";
const { pubClient } = require("../redis");
const { LOGGER } = require("../utils");
const { Match, User } = require("../models");
class Match_controller {
    /**
     * @param {string} _users_key_prefix
     * @param {string} _matches_key_prefix
     */
    constructor(_users_key_prefix = "user-", _matches_key_prefix = "match-") {
        this._matches_key_prefix = _matches_key_prefix;
        this._users_key_prefix = _users_key_prefix;
    }
    goblin() {
        return "ok";
    }
    /**
     * @param {string} uuid
     * @returns {Promise<boolean>}
     */
    async user_exists(uuid) {
        try {
            let exists = await pubClient.exists(
                `${this._users_key_prefix}${uuid}`
            );
            return exists == 1;
        } catch (error) {
            return false;
        }
    }
    /**
     * @param {string} muid
     * @returns {Promise<boolean>}
     */
    async match_exists(muid) {
        try {
            let exists = await pubClient.exists(
                `${this._matches_key_prefix}${muid}`
            );
            return exists == 1;
        } catch (error) {
            return false;
        }
    }
    /**
     * @returns {Promise<Array<User>>}
     */
    async get_all_users() {
        let _users = [];
        let keys = [];
        try {
            keys = await pubClient.keys(`${this._users_key_prefix}*`);
        } catch (error) {
            LOGGER(
                "Match Controller get_all_users ->",
                "client",
                reason,
                500,
                10
            );
            return [];
        }
        for (let i = 0; i < keys.length; i++) {
            const item = keys[i];
            let res = undefined;
            res = await pubClient.get(item);
            let { user, error } = User.from_json(res);
            if (!error) _users.push(user);
        }
        return _users;
    }
    /**
     * @returns {Promise<Array<Match>>}
     */
    async get_all_matches() {
        let _matches = [];
        let keys = [];
        try {
            keys = await pubClient.keys(`${this._matches_key_prefix}*`);
        } catch (error) {
            LOGGER(
                "Match Controller get_all_matches ->",
                "client",
                reason,
                500,
                10
            );
            return [];
        }
        for (let i = 0; i < keys.length; i++) {
            const item = keys[i];
            let res = undefined;
            res = await pubClient.get(item);
            let { match, error } = Match.from_json(res);
            if (!error) _matches.push(match);
        }
        return _matches;
    }
    /**
     * @param {User} _user
     * @param {boolean} overwrite
     * @returns {void}
     */
    async add_user(_user, overwrite = false) {
        let { user, error } = User.validate(_user);
        if (error) return LOGGER("server", "client", error, 500, 10);
        let exists = await this.user_exists(user.uuid);
        if (exists && !overwrite) return;
        pubClient.set(
            `${this._users_key_prefix}${user.uuid}`,
            JSON.stringify(user)
        );
    }
    /**
     * @param {string} uuid
     * @returns {Promise<boolean>}
     */
    async remove_user(uuid) {
        try {
            let user_s_mantch = (await this.get_all_matches()).filter((m) =>
                m.opponents.includes(uuid)
            )[0];
            if (user_s_mantch) {
                let index_of_user = user_s_mantch.opponents.indexOf(uuid);
                if (index_of_user > -1)
                    user_s_mantch.opponents.splice(index_of_user, 1);
            }
            let res = await pubClient.expire(
                `${this._users_key_prefix}${uuid}`,
                1
            );
            return res;
        } catch (error) {
            return false;
        }
    }
    /**
     * @param {Match} _match
     * @param {boolean} overwrite
     * @returns {void}
     */
    async add_match(_match, overwrite = false) {
        let { match, error } = Match.validate(_match);
        if (error) return LOGGER("server", "client", error, 500, 10);
        let exists = await this.match_exists(match.muid);
        if (exists && !overwrite) return;
        pubClient.set(
            `${this._matches_key_prefix}${match.muid}`,
            JSON.stringify(match)
        );
        // run the docker image
    }
    /**
     * @param {string} muid
     * @returns {Promise<boolean>}
     */
    async remove_match(muid) {
        try {
            let the_match = (await this.loadMatchAsync(muid))
            let res = await pubClient.expire(
                `${this._matches_key_prefix}${muid}`,
                1
            );
            the_match.opponents.forEach(async uuid => {
                await this.remove_user(uuid.toString())
            })
            return res;
        } catch (error) {
            return false;
        }
    }
    /**
     * @param {string} uuid
     * @returns {Promise<User|undefined>}
     */
    async loadUserAsync(uuid) {
        let _user = undefined;
        try {
            _user = await pubClient.get(`${this._users_key_prefix}${uuid}`);
        } catch (error) {
            LOGGER("server", uuid, reason, 500, 10);
            return undefined;
        }
        let { user, error } = User.from_json(_user);
        if (!error) return user;
        return undefined;
    }
    /**
     * @param {string} muid
     * @returns {Promise<Match|undefined>}
     */
    async loadMatchAsync(muid) {
        let _match = undefined;
        try {
            _match = await pubClient.get(`${this._matches_key_prefix}${muid}`);
        } catch (error) {
            LOGGER("server", muid, reason, 500, 10);
            return undefined;
        }
        let { match, error } = Match.from_json(_match);
        if (!error) return match;
        return undefined;
    }
    // async is_match_exists()
}

module.exports = { Match_controller };
