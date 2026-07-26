class DarkConsole {
    constructor() {
        this.logs = [];
    }

    log = (message) => {
        const date = new Date();
        const time = date.toLocaleTimeString();
        this.logs.push(`[${time}] ${message}`);
        this.updateView();
    };

    renderSettings = () => {
        setTimeout(() => this.updateView(), 100);
        return `<div id="dark_console" style="padding: 5px; max-height: 250px; overflow-y: auto; font-family: monospace; font-size: 11px;"></div>`;
    };

    updateView = () => {
        const $console = uw.$('#dark_console');
        if (!$console.length) return;
        this.logs.slice().reverse().forEach((msg, i) => {
            if (!uw.$(`#dark_log_${i}`).length) {
                $console.append(`<p id="dark_log_${i}" style="margin: 2px 0;">${msg}</p>`);
            }
        });
    };
}
