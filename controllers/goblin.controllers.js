"use strict";
const { pubClient } = require("../redis");
const { LOGGER } = require("../utils");
const { Match, MatchList, User, UserList } = require("../models").goblin_models;
class Match_controller {
    constructor() {
        /** @type {MatchList} */
        this.list = new MatchList()
        /** @type {UserList} */
        this.users = new UserList()
        this.loadMatches()
        this.loadUsers()
    }
    goblin () {
        return "ok"
    }
    /**
     * @param {User} _user 
     */
    add_user(_user) {
        let { user, error} = User.validate(_user)
        if (error) return LOGGER("server", "client", error, 500, 10)
        this.loadUsersAsync().then((is_done) => {
            this.users.add(user)
            this.saveUsers()
        }).catch(reason => {
            LOGGER("server", "client", reason, 500, 10)
        })
    }
    /**
     * @param {string} uuid 
     */
    remove_user(uuid) {
        this.loadUsersAsync().then((is_done) => {
            this.users.remove(uuid)
            this.saveUsers()
        }).catch(reason => {
            LOGGER("server", "client", reason, 500, 10)
        })
    }
    /**
     * @param {Match} _match 
     */
    add_match(_match) {
        let { match, error} = Match.validate(_match)
        if (error) return LOGGER("server", "client", error, 500, 10)
        this.loadMatchesAsync().then((is_done) => {
            this.list.add(match)
            this.saveMatches()
        }).catch(reason => {
            LOGGER("server", "client", reason, 500, 10)
        })
    }
    /**
     * @param {string} muid 
     */
    remove_match(muid) {
        this.loadMatchesAsync().then((is_done) => {
            this.list.remove(muid)
            this.saveMatches()
        }).catch(reason => {
            LOGGER("server", "client", reason, 500, 10)
        })
    }
    saveUsers() {
        pubClient.set("userlist", JSON.stringify(this.users))
    }
    saveMatches() {
        pubClient.set("matchlist",JSON.stringify(this.list))
    }
    /**
     * @returns {Promise<boolean>}
     */
    async loadUsersAsync() {
        return new Promise((resolve, reject) => {
            pubClient.get("userlist").then((value) => {
                if (!value) return resolve(false)
                let {users,error } = UserList.from_json(value)
                if (error) return reject(error)
                this.users = users
                return resolve(true)
            }).catch(reason => {
                return reject(reason)
            })
        })
    }
    /**
     * @returns {Promise<boolean>}
     */
    async loadMatchesAsync() {
        return new Promise((resolve, reject) => {
            pubClient.get("matchlist").then((value) => {
                if (!value) return resolve(false)
                let {match,error } = MatchList.from_json(value)
                if (error) return reject(error)
                this.list = match
                return resolve(true)
            }).catch(reason => {
                return reject(reason)
            })
        })
    }
    loadMatches() {
        pubClient.get("matchlist", (value) => {
            let {match ,error } = MatchList.from_json(value)
            if (!error) this.list = match
        })
    }
    loadUsers() {
        pubClient.get("userlist").then((value) => {
            let {users,error } = UserList.from_json(value)
            if (!error) this.users = users
        })
    }
    // TODO: add goblin properties and methods
}

module.exports = { Match_controller }