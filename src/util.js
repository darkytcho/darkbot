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
        if (!uw.gpAjax) return;
        if (uw.gpAjax._dbIntercepted) return;
        var console = DarkUtil._console;
        var origPost = uw.gpAjax.ajaxPost;
        var origGet = uw.gpAjax.ajaxGet;
        uw.gpAjax.ajaxPost = function(controller, action, data, skip, callback) {
            var wrappedCallback = function(response) {
                DarkUtil._lastResponse = { controller: controller, action: action, response: response, at: Date.now() };
                var found = false;
                if (response && response.errors && response.errors.length > 0) {
                    var msgs = response.errors.map(function(e) { return e.message || e; });
                    DarkUtil._lastError = { controller: controller, action: action, messages: msgs, at: Date.now() };
                    console.log('[API ERRO] ' + controller + '/' + action + ': ' + msgs.join(', '));
                    found = true;
                }
                if (response && response.json) {
                    if (response.json.errors && response.json.errors.length > 0) {
                        var msgs2 = response.json.errors.map(function(e) { return e.message || e; });
                        DarkUtil._lastError = { controller: controller, action: action, messages: msgs2, at: Date.now() };
                        console.log('[API ERRO] ' + controller + '/' + action + ': ' + msgs2.join(', '));
                        found = true;
                    }
                    if (response.json.error) {
                        DarkUtil._lastError = { controller: controller, action: action, messages: [response.json.error], at: Date.now() };
                        console.log('[API ERRO] ' + controller + '/' + action + ': ' + response.json.error);
                        found = true;
                    }
                    if (response.json.success === false && !found) {
                        console.log('[API WARN] ' + controller + '/' + action + ': success=false (resposta: ' + JSON.stringify(response.json).substring(0, 300) + ')');
                    }
                    if (response.json.success === true) {
                        DarkUtil._lastError = null;
                    }
                }
                if (!found && response && typeof console !== 'undefined') {
                    console.log('[API RES] ' + controller + '/' + action + ': ' + JSON.stringify(response).substring(0, 300));
                }
                if (typeof callback === 'function') callback(response);
            };
            return origPost.call(uw.gpAjax, controller, action, data, skip, wrappedCallback);
        };
        uw.gpAjax.ajaxGet = function(controller, action, data, skip, callback) {
            var wrappedCallback = function(response) {
                DarkUtil._lastResponse = { controller: controller, action: action, response: response, at: Date.now() };
                var found = false;
                if (response && response.errors && response.errors.length > 0) {
                    var msgs = response.errors.map(function(e) { return e.message || e; });
                    DarkUtil._lastError = { controller: controller, action: action, messages: msgs, at: Date.now() };
                    console.log('[API ERRO] ' + controller + '/' + action + ': ' + msgs.join(', '));
                    found = true;
                }
                if (response && response.json) {
                    if (response.json.errors && response.json.errors.length > 0) {
                        var msgs2 = response.json.errors.map(function(e) { return e.message || e; });
                        DarkUtil._lastError = { controller: controller, action: action, messages: msgs2, at: Date.now() };
                        console.log('[API ERRO] ' + controller + '/' + action + ': ' + msgs2.join(', '));
                        found = true;
                    }
                    if (response.json.error) {
                        DarkUtil._lastError = { controller: controller, action: action, messages: [response.json.error], at: Date.now() };
                        console.log('[API ERRO] ' + controller + '/' + action + ': ' + response.json.error);
                        found = true;
                    }
                    if (response.json.success === true) {
                        DarkUtil._lastError = null;
                    }
                }
                if (typeof callback === 'function') callback(response);
            };
            return origGet.call(uw.gpAjax, controller, action, data, skip, wrappedCallback);
        };
        uw.gpAjax._dbIntercepted = true;
        console.log('[DarkBot] API interceptor instalado');
    }

    static hasError(controller, action, withinMs) {
        DarkUtil._tryInstall();
        if (!DarkUtil._lastError) return false;
        if (DarkUtil._lastError.controller !== controller) return false;
        if (DarkUtil._lastError.action !== action) return false;
        if (withinMs && Date.now() - DarkUtil._lastError.at > withinMs) return false;
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
