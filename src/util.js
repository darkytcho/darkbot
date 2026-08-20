class DarkUtil {
    static _lock = null;
    static _lastResponse = null;
    static _lastError = null;

    static acquireLock(owner) {
        if (DarkUtil._lock) return false;
        DarkUtil._lock = { owner: owner, at: Date.now() };
        return true;
    }

    static releaseLock(owner) {
        if (DarkUtil._lock && DarkUtil._lock.owner === owner) DarkUtil._lock = null;
    }

    static isLocked() {
        return DarkUtil._lock !== null;
    }

    static _console = null;

    static installInterceptor(console) {
        DarkUtil._console = console;
        DarkUtil._tryInstall();
    }

    static _tryInstall() {
        if (!DarkUtil._console) return;
        if (uw.gpAjax && uw.gpAjax._i) return;
        var console = DarkUtil._console;

        if (uw.gpAjax) {
            var origPost = uw.gpAjax.ajaxPost;
            uw.gpAjax.ajaxPost = function(controller, action, data, skip, callback) {
                var wrappedCallback = function(response) {
                    DarkUtil._lastResponse = { controller: controller, action: action, response: response, at: Date.now() };
                    if (response && response.json) {
                        if (response.json.success === true) DarkUtil._lastError = null;
                        if (response.json.success === false) {
                            DarkUtil._lastError = { controller: controller, action: action, messages: ['success=false'], at: Date.now() };
                        }
                    }
                    if (typeof callback === 'function') callback(response);
                };
                return origPost.call(uw.gpAjax, controller, action, data, skip, wrappedCallback);
            };
            uw.gpAjax._i = true;
        }

        if (uw.HumanMessage) {
            var origError = uw.HumanMessage.error;
            uw.HumanMessage.error = function() {
                var msg = Array.prototype.slice.call(arguments).join(' ');
                console.log('[!] ' + msg);
                DarkUtil._lastError = { controller: 'game', action: 'HumanMessage.error', messages: [msg], at: Date.now() };
                return origError.apply(uw.HumanMessage, arguments);
            };
            var origSuccess = uw.HumanMessage.success;
            uw.HumanMessage.success = function() {
                var msg = Array.prototype.slice.call(arguments).join(' ');
                console.log('[+] ' + msg);
                DarkUtil._lastError = null;
                return origSuccess.apply(uw.HumanMessage, arguments);
            };
            console.log('[i] hm ok');
        }

        if (uw.gpAjax) {
            console.log('[i] ajax ok');
        }
    }

    static hasError(controller, action, withinMs) {
        DarkUtil._tryInstall();
        if (!DarkUtil._lastError) return false;
        if (withinMs && Date.now() - DarkUtil._lastError.at > withinMs) return false;
        if (DarkUtil._lastError.controller === 'game') return true;
        if (controller && DarkUtil._lastError.controller !== controller) return false;
        if (action && DarkUtil._lastError.action !== action) return false;
        return true;
    }

    static getLastError() {
        return DarkUtil._lastError;
    }

    constructor(console, storage) {
        this.console = console;
        this.storage = storage;
    }

    sleep = (ms, stdDev) => {
        if (typeof stdDev === 'undefined') return new Promise(resolve => setTimeout(resolve, ms));
        const mean = ms;
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        num = num * stdDev + mean;
        return new Promise(resolve => setTimeout(resolve, num));
    };

    randomDelay = (base, jitter) => {
        return this.sleep(base + Math.random() * jitter);
    };

    static shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
        return arr;
    }

    generateIslandList = () => {
        const townList = uw.MM.getOnlyCollectionByName('Town').models;
        const islandsList = [];
        const polisList = [];
        for (const town of townList) {
            const { island_id, id, on_small_island } = town.attributes;
            if (on_small_island) continue;
            if (!islandsList.includes(island_id)) {
                islandsList.push(island_id);
                polisList.push(id);
            }
        }
        return polisList;
    };

    countPopulation(obj) {
        const data = GameData.units;
        let total = 0;
        for (let key in obj) {
            total += data[key].population * obj[key];
        }
        return total;
    }
}
