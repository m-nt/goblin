const { Match_controller } = require('./match.controllers');
class MatchManager {
    /**
     * @param {Match_controller} Mctrl
     * @param {Number} frame_rate
     * @param {Number} threshold
     */
    constructor(Mctrl, frame_rate, threshold) {
        this.Mctrl = Mctrl
        this.threshold = threshold
        this.intervalId = setInterval(() => { this.Main(); }, 1000 / frame_rate)
        this.intervalIndex = 0
    }
    async Main() {
        let users = await this.Mctrl.get_all_users()
        console.log(`[${this.intervalIndex}] - MatchMaker Tick`)
        this.intervalIndex ++
    }
}
module.exports = { MatchManager }