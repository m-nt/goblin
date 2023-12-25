"use strict";
const { v4: uuid } = require("uuid");
const UserState = {
    LOBY: "loby",
    INGAME: "ingame",
    OFFLINE: "offline",
};
class User {
    /**
     * @param {string} uuid
     * @param {Number} rank
     * @param {UserState} state
     */
    constructor(uuid, rank = 0, state = UserState.LOBY) {
        this.uuid = uuid;
        this.rank = rank;
        this.state = state
    }
    /**
     * @param {any} data
     * @returns { {user:User, error:{message:string,index:Number,name:string}} }
     */
    static validate(data) {
        if (!data) return { user: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!data[key]) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { user: undefined , error: error}
            } else {
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
            _data = JSON.parse(data)
        } catch (error) {
            return { user: undefined, error: `${error}` }
        }
        if (!data) return { match: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!_data[key]) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { user: undefined , error: error}
            } else {
                _temp_model[key] = _data[key]
            }
        }
        return { user: _temp_model, error: undefined }
    }
}
const MatchState = {
    LOBY: "loby",
    PRELOAD: "preload",
    INGAME: "ingame",
    ENDING: "ending",
    ENDED: "ended",
    TERMINATION: "termination",
};
class Match {
    /**
     * @param {string} match_uid
     * @param {MatchState} state
     * @param {Array<User>} opponents
     */
    constructor(match_uid = undefined, state = undefined, opponents = []) {
        if (match_uid) this.muid = match_uid;
        else this.muid = uuid();
        if (state) this.state = state;
        else this.state = MatchState.LOBY;
        this.opponents = opponents;
    }
    /**
     * @param {any} data
     * @returns { {match:Match, error:{message:string,index:Number,name:string}} }
     */
    static validate(data) {
        if (!data) return { match: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!data[key]) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { match: undefined , error: error}
            } else {
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
            _data = JSON.parse(data)
        } catch (error) {
            return { match: undefined, error: `${error}` }
        }
        if (!data) return { match: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!_data[key]) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { match: undefined , error: error}
            } else {
                _temp_model[key] = _data[key]
            }
        }
        return { match: _temp_model, error: undefined }
    }
}
class UserList {
    constructor() {
        /** @type { {key:string, match:User} > } */
        this.users = {}
    }
    /**
     * @param {User} users 
     */
    add(users) {
        this.users[users.uuid] = users
    }
    /**
     * 
     * @param {string} muid 
     */
    remove(uuid) {
        delete this.users[uuid]
    }
    /**
     * @param {any} data
     * @returns { {users:UserList, error:{message:string,index:Number,name:string}} }
     */
    static validate(data) {
        if (!data) return { users: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!data[key]) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { users: undefined , error: error}
            } else {
                Object.keys(data[key]).forEach(data_key => {
                    _temp_model[key][data_key] = data[key][data_key]
                })
            }
        }
        return { users: _temp_model, error: undefined }
    }
    /**
     * @param {any} data
     * @returns { {users:UserList, error:{message:string,index:Number,name:string}} }
     */
    static from_json(data) {
        let _data = {}
        try {
            _data = JSON.parse(data)
        } catch (error) {
            return { users: undefined, error: `${error}` }
        }
        if (!data) return { users: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!_data[key]) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { users: undefined , error: error}
            } else {
                Object.keys(_data[key]).forEach(data_key => {
                    _temp_model[key][data_key] = _data[key][data_key]
                })
            }
        }
        return { users: _temp_model, error: undefined }
    }
}
class MatchList {
    constructor() {
        /** @type { {key:string, match:Match} > } */
        this.matches = {}
    }
    /**
     * @param {Match} match 
     */
    add(match) {
        this.matches[match.muid] = match
    }
    /**
     * 
     * @param {string} muid 
     */
    remove(muid) {
        delete this.matches[muid]
    }
    /**
     * @param {any} data
     * @returns { {matches:MatchList, error:{message:string,index:Number,name:string}} }
     */
    static validate(data) {
        if (!data) return { matches: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!data[key]) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { matches: undefined , error: error}
            } else {
                Object.keys(data[key]).forEach(data_key => {
                    _temp_model[key][data_key] = data[key][data_key]
                })
            }
        }
        return { matches: _temp_model, error: undefined }
    }
    /**
     * @param {any} data
     * @returns { {matches:MatchList, error:{message:string,index:Number,name:string}} }
     */
    static from_json(data) {
        let _data = {}
        try {
            _data = JSON.parse(data)
        } catch (error) {
            return { match: undefined, error: `${error}` }
        }
        if (!data) return { matches: undefined, error: {message:"unprocesable entity",index:0,name:"data"} }
        let _temp_model = new this()
        let _temp_model_keys = Object.keys(_temp_model)
        for (let index = 0; index < _temp_model_keys.length; index++) {
            let key = _temp_model_keys[index]
            if (!_data[key]) {
                let error = {
                    message: "Unprocessable entity",
                    index: index,
                    name: key,
                }
                return { matches: undefined , error: error}
            } else {
                Object.keys(_data[key]).forEach(data_key => {
                    _temp_model[key][data_key] = _data[key][data_key]
                })
            }
        }
        return { matches: _temp_model, error: undefined }
    }
}

module.exports = {
    Match,
    MatchList,
    User,
    UserList,
};
