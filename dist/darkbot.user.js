// ==UserScript==
// @name         DarkBot
// @author       DarkBot
// @description  Bot for Grepolis
// @version      1.0.0
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// ==/UserScript==

class DarkUtil {
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

    getButtonHtml(id, text, fn, props) {
        const name = this.constructor.name.charAt(0).toLowerCase() + this.constructor.name.slice(1);
        props = isNaN(parseInt(props)) ? `'${props}'` : props;
        const click = `window.darkBot.${name}.${fn.name}(${props || ''})`;
        return `
      <div id="${id}" style="cursor: pointer" class="button_new" onclick="${click}">
        <div class="left"></div>
        <div class="right"></div>
        <div class="caption js-caption"> ${text} <div class="effect js-effect"></div></div>
      </div>`;
    }

    getTitleHtml(id, text, fn, props, enable, desc = '(click to toggle)') {
        const name = this.constructor.name.charAt(0).toLowerCase() + this.constructor.name.slice(1);
        props = isNaN(parseInt(props)) && props ? `"${props}"` : props;
        const click = `window.darkBot.${name}.${fn.name}(${props || ''})`;
        const filter = 'brightness(100%) saturate(186%) hue-rotate(241deg)';
        return `
        <div class="game_border_top"></div>
        <div class="game_border_bottom"></div>
        <div class="game_border_left"></div>
        <div class="game_border_right"></div>
        <div class="game_border_corner corner1"></div>
        <div class="game_border_corner corner2"></div>
        <div class="game_border_corner corner3"></div>
        <div class="game_border_corner corner4"></div>
        <div id="${id}" style="cursor: pointer; filter: ${enable ? filter : ''}" class="game_header bold" onclick="${click}">
            ${text}
            <span class="command_count"></span>
            <div style="position: absolute; right: 10px; top: 4px; font-size: 10px;"> ${desc} </div>
        </div>`;
    }

    countPopulation(obj) {
        const data = GameData.units;
        let total = 0;
        for (let key in obj) {
            total += data[key].population * obj[key];
        }
        return total;
    }

    createButton = (id, text, fn) => {
        const $button = $('<div>', { id, class: 'button_new' });
        $button.append($('<div>', { class: 'left' }));
        $button.append($('<div>', { class: 'right' }));
        $button.append($('<div>', {
            class: 'caption js-caption',
            html: `${text} <div class="effect js-effect"></div>`
        }));
        if (fn) $(document).on('click', `#${id}`, fn);
        return $button;
    }

    createActivity = (background) => {
        const $activity_wrap = $('<div class="activity_wrap"></div>');
        const $activity = $('<div class="activity"></div>');
        const $icon = $('<div class="icon"></div>').css({
            "background": background,
            "position": "absolute",
            "top": "-1px",
            "left": "-1px",
        });
        const $count = $('<div class="count js-caption"></div>').text(0);
        $icon.append($count);
        $activity.append($icon);
        $activity_wrap.append($activity);
        return { $activity, $count };
    }

    createPopup = (left, width, height, $content) => {
        const $box = $('<div class="sandy-box js-dropdown-list"></div>').css({
            "left": `${left}px`,
            "position": "absolute",
            "width": `${width}px`,
            "height": `${height}px`,
            "top": "29px",
            "margin-left": "0px",
            "display": "none",
        });
        const $corner_tl = $('<div class="corner_tl"></div>');
        const $corner_tr = $('<div class="corner_tr"></div>');
        const $corner_bl = $('<div class="corner_bl"></div>');
        const $corner_br = $('<div class="corner_br"></div>');
        const $border_t = $('<div class="border_t"></div>');
        const $border_b = $('<div class="border_b"></div>');
        const $border_l = $('<div class="border_l"></div>');
        const $border_r = $('<div class="border_r"></div>');
        const $middle = $('<div class="middle"></div>').css({
            "left": "10px", "right": "20px", "top": "14px", "bottom": "20px",
        });
        const $middle_content = $('<div class="content js-dropdown-item-list"></div>').append($content);
        $middle.append($middle_content);
        $box.append($corner_tl, $corner_tr, $corner_bl, $corner_br, $border_t, $border_b, $border_l, $border_r, $middle);
        return $box;
    }
}


class DarkStorage {
    getStorage = () => {
        const worldId = uw.Game.world_id;
        const savedValue = localStorage.getItem(`${worldId}_darkBot`);
        let storage = {};
        if (savedValue !== null && savedValue !== undefined) {
            try { storage = JSON.parse(savedValue); } catch (e) { console.error(`DarkBot storage parse error: ${e}`); }
        }
        return storage;
    };

    saveStorage = storage => {
        try {
            const worldId = uw.Game.world_id;
            localStorage.setItem(`${worldId}_darkBot`, JSON.stringify(storage));
            return true;
        } catch (e) { console.error(`DarkBot storage save error: ${e}`); return false; }
    };

    save = (key, content) => {
        const storage = this.getStorage();
        storage[key] = content;
        return this.saveStorage(storage);
    };

    load = (key, defaultValue = null) => {
        const storage = this.getStorage();
        const savedValue = storage[key];
        return savedValue !== undefined ? savedValue : defaultValue;
    };
}


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


class DarkWindow {
    constructor({ id, title, size, tabs, start_tab, minimizable = true }) {
        this.minimizable = minimizable;
        this.width = size[0];
        this.height = size[1];
        this.title = title;
        this.id = id;
        this.tabs = tabs;
        this.start_tab = start_tab;

        const createWindowType = (name, title, width, height, minimizable) => {
            function WndHandler(wndhandle) { this.wnd = wndhandle; }
            Function.prototype.inherits.call(WndHandler, uw.WndHandlerDefault);
            WndHandler.prototype.getDefaultWindowOptions = function () {
                return {
                    position: ['center', 'center', 100, 100],
                    width, height, minimizable, title,
                };
            };
            uw.GPWindowMgr.addWndType(name, `${name}_darkbot`, WndHandler, 1);
        };

        const getTabById = (id) => this.tabs.filter((tab) => tab.id === id)[0];

        this.activate = function () {
            createWindowType(this.id, this.title, this.width, this.height, this.minimizable);
            uw.$(`<style id="${this.id}_style">
                #${this.id} .tab_icon { left: 23px; }
                #${this.id} { top: -36px; right: 95px; }
                #${this.id} .submenu_link { color: #000; }
                #${this.id} .submenu_link:hover { text-decoration: none; }
                #${this.id} li { float: left; min-width: 60px; }
            </style>`).appendTo('head');
        };

        this.openWindow = function () {
            let wn = uw.Layout.wnd.getOpenFirst(uw.GPWindowMgr[`TYPE_${this.id}`]);
            if (wn) { if (wn.isMinimized()) wn.maximizeWindow(); return; }

            let content = `<ul id="${this.id}" class="menu_inner"></ul><div id="${this.id}_content"></div>`;
            uw.Layout.wnd.Create(uw.GPWindowMgr[`TYPE_${this.id}`]).setContent(content);

            this.tabs.forEach((e) => {
                uw.$(`<li><a id="${e.id}" class="submenu_link" href="#"><span class="left"><span class="right"><span class="middle"><span class="tab_label"> ${e.title} </span></span></span></span></a></li>`).appendTo(`#${this.id}`);
            });

            let tabs = this.tabs.map(e => `#${this.id} #${e.id}`).join(', ');
            let self = this;
            uw.$(tabs).click(function () { self.renderTab(this.id); });
            this.renderTab(this.tabs[this.start_tab].id);
        };

        this.renderTab = function (id) {
            let tab = getTabById(id);
            uw.$(`#${this.id}_content`).html(tab.render());
            uw.$(`#${this.id} .active`).removeClass('active');
            uw.$(`#${id}`).addClass('active');
            if (tab.afterRender) tab.afterRender();
        };
    }
}


class AutoFarm extends DarkUtil {
    constructor(c, s) {
        super(c, s);
        this.timing = this.storage.load('af_timing', 300000);
        this.percent = this.storage.load('af_percent', 1);
        this.active = this.storage.load('af_active', false);
        this.timer = 0;
        this.lastTime = Date.now();

        const { $activity, $count } = this.createActivity("url(https://gpit.innogamescdn.com/images/game/premium_features/feature_icons_2.08.png) no-repeat 0 -240px");
        this.$activity = $activity;
        this.$count = $count;
        this.$activity.on('click', this.toggle);
        this.createDropdown();
        this.updateButtons();

        if (this.active) this.active = setInterval(this.main, 1000);
    }

    createDropdown = () => {
        this.$content = $("<div></div>");
        this.$title = $("<p>Dark Farm</p>").css({ "text-align": "center", "margin": "2px", "font-weight": "bold", "font-size": "16px" });
        this.$content.append(this.$title);

        this.$duration = $("<p>Duração:</p>").css({ "text-align": "left", "margin": "2px", "font-weight": "bold" });
        this.$button5 = this.createButton("dark_farm_5", "5 min", this.toggleDuration);
        this.$button10 = this.createButton("dark_farm_10", "10 min", this.toggleDuration);
        this.$button20 = this.createButton("dark_farm_20", "20 min", this.toggleDuration);
        this.$content.append(this.$duration, this.$button5, this.$button10, this.$button20);

        this.$storageLabel = $("<p>Armazenamento:</p>").css({ "text-align": "left", "margin": "2px", "font-weight": "bold" });
        this.$button80 = this.createButton("dark_farm_80", "80%", this.toggleStorage).css({ "width": "70px" });
        this.$button90 = this.createButton("dark_farm_90", "90%", this.toggleStorage).css({ "width": "80px" });
        this.$button100 = this.createButton("dark_farm_100", "100%", this.toggleStorage).css({ "width": "80px" });
        this.$content.append(this.$storageLabel, this.$button80, this.$button90, this.$button100);

        this.$popup = this.createPopup(423, 250, 170, this.$content);
        this.dropdown_active = false;

        const close = () => { if (!this.dropdown_active) this.$popup.hide(); this.dropdown_active = false; };
        const open = () => { if (this.dropdown_active) this.$popup.show(); };

        this.$activity.on({
            mouseenter: () => { this.dropdown_active = true; setTimeout(open, 1000); },
            mouseleave: () => { this.dropdown_active = false; setTimeout(close, 50); }
        });
        this.$popup.on({
            mouseenter: () => { this.dropdown_active = true; },
            mouseleave: () => { this.dropdown_active = false; setTimeout(close, 50); }
        });
    }

    updateButtons = () => {
        this.$button5.addClass('disabled');
        this.$button10.addClass('disabled');
        this.$button20.addClass('disabled');
        this.$button80.addClass('disabled');
        this.$button90.addClass('disabled');
        this.$button100.addClass('disabled');

        if (this.timing == 300000) this.$button5.removeClass('disabled');
        if (this.timing == 600000) this.$button10.removeClass('disabled');
        if (this.timing == 1200000) this.$button20.removeClass('disabled');

        if (this.percent == 0.8) this.$button80.removeClass('disabled');
        if (this.percent == 0.9) this.$button90.removeClass('disabled');
        if (this.percent == 1) this.$button100.removeClass('disabled');

        if (!this.active) {
            this.$count.css('color', "red");
            this.$count.text("");
        }
    }

    toggleDuration = (event) => {
        const { id } = event.currentTarget;
        if (id == "dark_farm_5") this.timing = 300_000;
        if (id == "dark_farm_10") this.timing = 600_000;
        if (id == "dark_farm_20") this.timing = 1_200_000;
        this.storage.save('af_timing', this.timing);
        this.updateButtons();
    }

    toggleStorage = (event) => {
        const { id } = event.currentTarget;
        if (id == "dark_farm_80") this.percent = 0.8;
        if (id == "dark_farm_90") this.percent = 0.9;
        if (id == "dark_farm_100") this.percent = 1;
        this.storage.save('af_percent', this.percent);
        this.updateButtons();
    }

    generateList = () => {
        const islands_list = new Set();
        const polis_list = [];
        const { models: towns } = uw.MM.getOnlyCollectionByName('Town');
        for (const town of towns) {
            const { on_small_island, island_id, id } = town.attributes;
            if (on_small_island || islands_list.has(island_id)) continue;
            islands_list.add(island_id);
            polis_list.push(town.id);
        }
        return polis_list;
    };

    toggle = () => {
        if (this.active) {
            clearInterval(this.active);
            this.active = null;
            this.console.log('AutoFarm desativado');
        } else {
            this.updateTimer();
            this.active = setInterval(this.main, 1000);
            this.console.log('AutoFarm ativado');
        }
        this.storage.save('af_active', !!this.active);
        this.updateButtons();
    };

    getNextCollection = () => {
        const { models } = uw.MM.getCollections().FarmTownPlayerRelation[0];
        const lootCounts = {};
        for (const model of models) {
            const { lootable_at } = model.attributes;
            lootCounts[lootable_at] = (lootCounts[lootable_at] || 0) + 1;
        }
        let maxLootableTime = 0, maxValue = 0;
        for (const lootableTime in lootCounts) {
            const value = lootCounts[lootableTime];
            if (value < maxValue) continue;
            maxLootableTime = lootableTime;
            maxValue = value;
        }
        const seconds = maxLootableTime - Math.floor(Date.now() / 1000);
        return seconds > 0 ? seconds * 1000 : 0;
    };

    updateTimer = () => {
        const currentTime = Date.now();
        this.timer -= currentTime - this.lastTime;
        this.lastTime = currentTime;
        const isCaptainActive = uw.GameDataPremium.isAdvisorActivated('captain');
        this.$count.text(Math.round(Math.max(this.timer, 0) / 1000));
        this.$count.css('color', isCaptainActive ? "#1aff1a" : "yellow");
    };

    claim = async () => {
        const isCaptainActive = uw.GameDataPremium.isAdvisorActivated('captain');
        const polis_list = this.generateList();

        if (isCaptainActive) {
            await this.fakeOpening();
            await this.sleep(Math.random() * 2000 + 1000);
            await this.fakeSelectAll();
            await this.sleep(Math.random() * 2000 + 1000);
            if (this.timing <= 600_000) await this.claimMultiple(300, 600);
            if (this.timing > 600_000) await this.claimMultiple(1200, 2400);
            await this.fakeUpdate();
            setTimeout(() => uw.WMap.removeFarmTownLootCooldownIconAndRefreshLootTimers(), 2000);
            return;
        }

        let max = 60;
        const { models: player_relation_models } = uw.MM.getOnlyCollectionByName('FarmTownPlayerRelation');
        const { models: farm_town_models } = uw.MM.getOnlyCollectionByName('FarmTown');
        const now = Math.floor(Date.now() / 1000);
        for (let town_id of polis_list) {
            let town = uw.ITowns.towns[town_id];
            let x = town.getIslandCoordinateX();
            let y = town.getIslandCoordinateY();
            for (let farm_town of farm_town_models) {
                if (farm_town.attributes.island_x != x || farm_town.attributes.island_y != y) continue;
                for (let relation of player_relation_models) {
                    if (farm_town.attributes.id != relation.attributes.farm_town_id) continue;
                    if (relation.attributes.relation_status !== 1) continue;
                    if (relation.attributes.lootable_at !== null && now < relation.attributes.lootable_at) continue;
                    this.claimSingle(town_id, relation.attributes.farm_town_id, relation.id, Math.ceil(this.timing / 600_000));
                    await this.sleep(500);
                    if (!max) return;
                    else max -= 1;
                }
            }
        }
        setTimeout(() => uw.WMap.removeFarmTownLootCooldownIconAndRefreshLootTimers(), 2000);
    };

    main = async () => {
        const next_collection = this.getNextCollection();
        if (next_collection && (this.timer > next_collection + 60 * 1_000 || this.timer < next_collection)) {
            this.timer = next_collection + Math.floor(Math.random() * 20_000) + 10_000;
        }

        if (this.timer < 1) {
            clearInterval(this.active);
            this.active = null;
            await this.claim();
            this.active = setInterval(this.main, 1000);
            const rand = Math.floor(Math.random() * 20_000) + 10_000;
            this.timer = this.timing + rand;
            if (this.timer < next_collection) this.timer = next_collection + rand;
        }
        this.updateTimer();
    };

    claimSingle = (town_id, farm_town_id, relation_id, option = 1) => {
        const data = {
            model_url: `FarmTownPlayerRelation/${relation_id}`,
            action_name: 'claim',
            arguments: { farm_town_id, type: 'resources', option },
            town_id,
        };
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', data);
    };

    claimMultiple = (base = 300, boost = 600) =>
        new Promise((resolve) => {
            const polis_list = this.generateList();
            let data = {
                towns: polis_list,
                time_option_base: base,
                time_option_booty: boost,
                claim_factor: 'normal',
            };
            uw.gpAjax.ajaxPost('farm_town_overviews', 'claim_loads_multiple', data, false, () => resolve());
        });

    fakeOpening = () =>
        new Promise((resolve) => {
            uw.gpAjax.ajaxGet('farm_town_overviews', 'index', {}, false, async () => {
                await this.sleep(10);
                await this.fakeUpdate();
                resolve();
            });
        });

    fakeSelectAll = () =>
        new Promise((resolve) => {
            const data = { town_ids: this.polis_list };
            uw.gpAjax.ajaxGet('farm_town_overviews', 'get_farm_towns_from_multiple_towns', data, false, () => resolve());
        });

    fakeUpdate = () =>
        new Promise((resolve) => {
            const town = uw.ITowns.getCurrentTown();
            const { attributes: booty } = town.getResearches();
            const { attributes: trade_office } = town.getBuildings();
            const data = {
                island_x: town.getIslandCoordinateX(),
                island_y: town.getIslandCoordinateY(),
                current_town_id: town.id,
                booty_researched: booty ? 1 : 0,
                diplomacy_researched: '',
                trade_office: trade_office ? 1 : 0,
            };
            uw.gpAjax.ajaxGet('farm_town_overviews', 'get_farm_towns_for_town', data, false, () => resolve());
        });

    settings = () => {
        return `
        <div class="game_border" style="margin-bottom: 20px">
            <div class="game_border_top"></div>
            <div class="game_border_bottom"></div>
            <div class="game_border_left"></div>
            <div class="game_border_right"></div>
            <div class="game_border_corner corner1"></div>
            <div class="game_border_corner corner2"></div>
            <div class="game_border_corner corner3"></div>
            <div class="game_border_corner corner4"></div>
            <div id="auto_farm_title" style="cursor: pointer; filter: ${this.active ? 'brightness(100%) saturate(186%) hue-rotate(241deg)' : ''}" class="game_header bold" onclick="window.darkBot.autoFarm.toggle()">
                Auto Farm <span class="command_count"></span>
                <div style="position: absolute; right: 10px; top: 4px; font-size: 10px;"> (click to toggle) </div>
            </div>
            <div style="padding: 5px;">
                <p style="margin: 2px; font-weight: bold;">Duração:</p>
                ${this.getButtonHtml('farm_time_5', '5 min', this.toggleDuration, 'dark_farm_5')}
                ${this.getButtonHtml('farm_time_10', '10 min', this.toggleDuration, 'dark_farm_10')}
                ${this.getButtonHtml('farm_time_20', '20 min', this.toggleDuration, 'dark_farm_20')}
            </div>
            <div style="padding: 5px;">
                <p style="margin: 2px; font-weight: bold;">Armazenamento:</p>
                ${this.getButtonHtml('farm_stor_80', '80%', this.toggleStorage, 'dark_farm_80')}
                ${this.getButtonHtml('farm_stor_90', '90%', this.toggleStorage, 'dark_farm_90')}
                ${this.getButtonHtml('farm_stor_100', '100%', this.toggleStorage, 'dark_farm_100')}
            </div>
        </div>`;
    };
}


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


