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
        return `<div id="_cl" class="x-co"></div>`;
    };

    startLiveUpdate = () => {
        this._updateView();
    };

    _updateView = () => {
        const el = document.getElementById('_cl');
        if (!el) return;
        el.innerHTML = this.logs.slice().reverse().map(l =>
            `<div class="x-cl"><span class="x-tm">[${l.time}]</span> ${l.message}</div>`
        ).join('');
    };
}
