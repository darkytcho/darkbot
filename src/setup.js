class DarkBot {
    constructor() {
        this.console = new DarkConsole();
        this.storage = new DarkStorage();
        this.$ui = $("#ui_box");

        this.autoFarm = new AutoFarm(this.console, this.storage);

        this.settingsWindow = new DarkWindow({
            id: 'DARK_BOT',
            title: 'DarkBot',
            size: [845, 300],
            tabs: [
                {
                    title: 'Farm',
                    id: 'farm',
                    render: () => this.autoFarm.settings(),
                },
                {
                    title: 'Console',
                    id: 'console',
                    render: this.console.renderSettings,
                },
            ],
            start_tab: 0,
        });

        this.setup();
    }

    setup = () => {
        this.settingsWindow.activate();

        uw.$('head').append(`<style>
            .dark_bot_btn {
                width: 30px; height: 30px; border-radius: 50%;
                background: #2a2a2a; border: 2px solid #555;
                cursor: pointer; display: flex; align-items: center;
                justify-content: center; transition: all 0.2s;
            }
            .dark_bot_btn:hover { background: #444; border-color: #ffd700; }
            .dark_bot_btn::after {
                content: "\\2699"; font-size: 18px; color: #ccc;
            }
            .dark_bot_btn:hover::after { color: #ffd700; }
        </style>`);

        const $btn = uw.$(`<div class="dark_bot_btn" title="DarkBot Settings"></div>`);
        $btn.on('click', () => this.settingsWindow.openWindow());

        // Tenta adicionar ao lado dos deuses, senão adiciona no topo
        const $gods = uw.$('.gods_area_buttons');
        if ($gods.length) {
            $gods.append($btn);
        } else {
            uw.$('#ui_box').prepend(
                uw.$('<div>').css({ position: 'absolute', top: '5px', right: '10px', zIndex: 9999 }).append($btn)
            );
        }

        this.console.log('DarkBot carregado com sucesso!');
    };
}

const darkBotLoader = setInterval(() => {
    if ($("#loader").length > 0) return;
    uw.darkBot = new DarkBot();
    clearInterval(darkBotLoader);
}, 100);
