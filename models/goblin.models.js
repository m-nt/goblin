"use strict";
const { v4: uuid } = require("uuid");
const { LOGGER } = require("../utils");
const UserState = {
    LOBY: "loby",
    READY: "ready",
    INGAME: "ingame",
    OFFLINE: "offline",
};
class User {
    /**
     * @param {string} uuid
     * @param {Number} rank
     * @param {UserState} state
     * @param {Array<string>} companions
     * @param {string}
     */
    constructor(uuid, rank = 0, state = UserState.LOBY, companions = [], game_type = "1v1") {
        this.uuid = uuid;
        this.rank = rank;
        this.state = state;
        this.companions = companions
        this.offline_counter = 0;
        this.game_type = game_type
    }
    /**
     * @param {any} data
     * @returns { {user:User, error:{message:string,index:Number,name:string}} }
     */
    static validate(data) {
        if (!data) {
            LOGGER("User validate ->", "client", error, 500, 10)
            return { user: undefined, error: { message: "unprocesable entity", index: 0, name: "data" } }
        }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!data[key] && (_temp_model[key] == undefined || _temp_model[key] == null)) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { user: undefined , error: error}
            } else if (data[key]){
                _temp_model[key] = data[key]
            }
        }
        return { user: _temp_model, error: undefined }
    }
    /**
     * @param {any} data
     * @returns { {user:User, error:{message:string,index:Number,name:string}} }
     */
    static from_json(data) {
        let _data = {}
        try {
            _data = data instanceof Object ? data :JSON.parse(data)
        } catch (error) {
            LOGGER("User from_json ->", `${data}`, error, 500, 10)
            return { user: undefined, error: `${error}` }
        }
        if (!data) return { match: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!_data[key] && (_temp_model[key] == undefined || _temp_model[key] == null)) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { user: undefined , error: error}
            } else if (_data[key]){
                _temp_model[key] = _data[key]
            }
        }
        return { user: _temp_model, error: undefined }
    }
}
const MatchState = {
    INGAME: "ingame",
    ENDING: "ending",
    ENDED: "ended",
    TERMINATION: "termination",
};
class Match {
    /**
     * @param {string} match_uid
     * @param {MatchState} state
     * @param {Array<uuid>} opponents
     * @param {Number} port
     */
    constructor(match_uid = undefined, state = undefined, opponents = [], port = 0) {
        if (match_uid) this.muid = match_uid;
        else this.muid = crypto.randomUUID();
        if (state) this.state = state;
        else this.state = MatchState.INGAME;
        this.opponents = opponents;
        this.port = port
    }
    /**
     * @param {any} data
     * @returns { {match:Match, error:{message:string,index:Number,name:string}} }
     */
    static validate(data) {
        if (!data) {
            LOGGER("Match validate ->", "client", error, 500, 10)
            return { match: undefined, error: { message: "unprocesable entity", index: 0, name: "data" } }
        }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!data[key] && (_temp_model[key] == undefined || _temp_model == null)) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { match: undefined , error: error}
            } else if (data[key]){
                _temp_model[key] = data[key]
            }
        }
        return { match: _temp_model, error: undefined }
    }
    /**
     * @param {any} data
     * @returns { {match:Match, error:{message:string,index:Number,name:string}} }
     */
    static from_json(data) {
        let _data = {}
        try {
            _data = data instanceof Object ? data :JSON.parse(data)
        } catch (error) {
            LOGGER("Match from_json ->", `${data}`, error, 500, 10)
            return { match: undefined, error: `${error}` }
        }
        if (!data) return { match: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!_data[key] && (_temp_model[key] == undefined || _temp_model == null)) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { match: undefined , error: error}
            } else if (_data[key]){
                _temp_model[key] = _data[key]
            }
        }
        return { match: _temp_model, error: undefined }
    }
}
class WSData {
    /**
     * @param {string} action
     * @param {any} data
     */
    constructor(action, data){
        this.action = action
        this.data = data
    }
    /**
     * @param {any} data
     * @returns { {wsdata:WSData, error:{message:string,index:Number,name:string}} }
     */
    static validate(data) {
        if (!data) {
            LOGGER("WSData validate ->", "client", error, 500, 10)
            return { match: undefined, error: { message: "unprocesable entity", index: 0, name: "data" } }
        }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!data[key] && (_temp_model[key] == undefined || _temp_model == null)) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { match: undefined , error: error}
            } else if (data[key]){
                _temp_model[key] = data[key]
            }
        }
        return { match: _temp_model, error: undefined }
    }
    /**
     * @param {any} data
     * @returns { {wsdata:WSData, error:{message:string,index:Number,name:string}} }
     */
    static from_json(data) {
        let _data = {}
        try {
            _data = data instanceof Object ? data :JSON.parse(data)
        } catch (error) {
            LOGGER("WSData from_json ->", `${data}`, error, 500, 10)
            return { match: undefined, error: `${error}` }
        }
        if (!data) return { match: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            console.log(_data[key]);
            if (!_data[key] && (_temp_model[key] == undefined || _temp_model == null)) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { match: undefined , error: error}
            } else if (_data[key]){
                _temp_model[key] = _data[key]
            }
        }
        return { wsdata: _temp_model, error: undefined }
    }
}
module.exports = {
    Match,
    User,
    WSData
};
