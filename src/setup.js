class DarkBot {
    constructor() {
        this.console = new DarkConsole();
        this.storage = new DarkStorage();
        DarkUtil.installInterceptor(this.console);
        this.autoFarm = new AutoFarm(this.console, this.storage);
        this.autoBuild = new AutoBuild(this.console, this.storage);
        this.autoTrain = new AutoTrain(this.console, this.storage);

        this.ui = new DarkUI();
        this.ui.createPanel({ id: '_p', title: 'Tool', width: 420, height: 420 });
        this.ui.addTab({ id: 'farm', label: 'Farm', render: () => this.autoFarm.render(), afterRender: () => this.autoFarm.afterRender() });
        this.ui.addTab({ id: 'build', label: 'Build', render: () => this.autoBuild.render(), afterRender: () => this.autoBuild.afterRender() });
        this.ui.addTab({ id: 'train', label: 'Train', render: () => this.autoTrain.render(), afterRender: () => this.autoTrain.afterRender() });
        this.ui.addTab({ id: 'console', label: 'Console', render: () => this.console.renderSettings(), afterRender: () => this.console.startLiveUpdate() });

        this.createToggleButton();
        this.console.log('ok');
    }

    createToggleButton = () => {
        const btn = document.createElement('div');
        btn.className = '_tb';
        btn.textContent = '\u2699';
        btn.title = 'Tool';
        btn.id = '_t';
        btn.onclick = () => {
            if (this.ui) this.ui.toggle();
        };
        document.body.appendChild(btn);
    };

    cleanup = () => {
        this.ui.cleanup();
        const toggle = document.getElementById('_t');
        if (toggle) toggle.remove();
    };
}
