class DarkConsole {
    constructor() {
        this.logs = [];
        this._liveInterval = null;
    }

    log = (message) => {
        const date = new Date();
        const time = date.toLocaleTimeString();
        this.logs.push({ time, message });
        this._updateView();
    };

    renderSettings = () => {
        return `<div id="dark_console" class="db-console"></div>`;
    };

    startLiveUpdate = () => {
        this._updateView();
    };

    _updateView = () => {
        const el = document.getElementById('dark_console');
        if (!el) return;
        el.innerHTML = this.logs.slice().reverse().map(l =>
            `<div class="db-console-line"><span class="db-time">[${l.time}]</span> ${l.message}</div>`
        ).join('');
    };
}
