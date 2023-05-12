export class Timer {
    constructor() { }
    begin = Date.now();
    time() {
        return Date.now() - this.begin;
    }
    static defaultTimer = new Timer();
    static getDefaultTimer() {
        return this.defaultTimer;
    }
}
