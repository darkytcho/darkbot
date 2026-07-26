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
        const style = document.createElement('style');
        style.textContent = `
            .darkbot-toggle-btn {
                position: fixed; top: 50%; right: 0;
                transform: translateY(-50%);
                width: 32px; height: 64px;
                background: #0f3460; border: 2px solid #e94560;
                border-right: none;
                border-radius: 8px 0 0 8px;
                cursor: pointer; z-index: 99998;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.2s; color: #e94560;
                font-size: 16px; font-weight: 900;
                font-family: 'Segoe UI', Arial, sans-serif;
            }
            .darkbot-toggle-btn:hover {
                background: #e94560; color: #fff;
                width: 38px;
            }
        `;
        document.head.appendChild(style);

        const btn = document.createElement('div');
        btn.className = 'darkbot-toggle-btn';
        btn.textContent = 'DB';
        btn.title = 'DarkBot';
        btn.onclick = () => this.ui.toggle();
        document.body.appendChild(btn);
    };
}

const darkBotLoader = setInterval(() => {
    if (document.getElementById('loader')) return;
    window.darkBot = new DarkBot();
    clearInterval(darkBotLoader);
}, 100);
