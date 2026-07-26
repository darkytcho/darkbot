class DarkBot {
    constructor() {
        this.console = new DarkConsole();
        this.storage = new DarkStorage();
        this.autoFarm = new AutoFarm(this.console, this.storage);

        this.ui = new DarkUI();
        this.ui.createPanel({ id: 'darkbot', title: 'DARKBOT', width: 420, height: 420 });
        this.ui.addTab({ id: 'farm', label: 'Farm', render: () => this.autoFarm.render(), afterRender: () => this.autoFarm.afterRender() });
        this.ui.addTab({ id: 'console', label: 'Console', render: () => this.console.renderSettings(), afterRender: () => this.console.startLiveUpdate() });

        this.createToggleButton();
        this.console.log('DarkBot carregado com sucesso!');
    }

    createToggleButton = () => {
        const btn = document.createElement('div');
        btn.className = 'darkbot-toggle-btn';
        btn.textContent = 'DB';
        btn.title = 'DarkBot';
        btn.id = 'darkbot-toggle';
        document.body.appendChild(btn);
    };

    cleanup = () => {
        this.ui.cleanup();
        const toggle = document.getElementById('darkbot-toggle');
        if (toggle) toggle.remove();
    };
}
