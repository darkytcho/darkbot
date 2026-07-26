// ==UserScript==
// @name         DarkBot
// @author       DarkBot
// @description  Bot for Grepolis
// @version      0.2.0-beta
// @match        http://*.grepolis.com/game/*
// @match        https://*.grepolis.com/game/*
// @run-at       document-idle
// ==/UserScript==

(function () {
    if (window.opener) {
        window.close();
        return;
    }

    document.head.appendChild(document.createElement('style')).textContent = `
    .darkbot-toggle-btn {
        position: fixed; top: 50%; right: 0;
        transform: translateY(-50%);
        width: 32px; height: 64px;
        background: #1a0f06; border: 2px solid #8b6914;
        border-right: none;
        border-radius: 8px 0 0 8px;
        cursor: pointer; z-index: 99998;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.2s; color: #d4a017;
        font-size: 16px; font-weight: 900;
        font-family: 'Segoe UI', Arial, sans-serif;
    }
    .darkbot-toggle-btn:hover {
        background: #8b6914; color: #fff;
        width: 38px;
    }
`;
    window._darkbotStyleEl = document.head.querySelector('style');

    let script = document.head.appendChild(document.createElement('script'));
    script.textContent = `
    (function () {
        if (window.opener) {
            window.close();
            return;
        }

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

    countPopulation(obj) {
        const data = GameData.units;
        let total = 0;
        for (let key in obj) {
            total += data[key].population * obj[key];
        }
        return total;
    }
}


class DarkStorage {
    getStorage = () => {
        const worldId = uw.Game.world_id;
        const savedValue = localStorage.getItem(\`${worldId}_darkBot\`);
        let storage = {};
        if (savedValue !== null && savedValue !== undefined) {
            try { storage = JSON.parse(savedValue); } catch (e) { console.error(\`DarkBot storage parse error: ${e}\`); }
        }
        return storage;
    };

    saveStorage = storage => {
        try {
            const worldId = uw.Game.world_id;
            localStorage.setItem(\`${worldId}_darkBot\`, JSON.stringify(storage));
            return true;
        } catch (e) { console.error(\`DarkBot storage save error: ${e}\`); return false; }
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
        this._liveInterval = null;
    }

    log = (message) => {
        const date = new Date();
        const time = date.toLocaleTimeString();
        this.logs.push({ time, message });
        this._updateView();
    };

    renderSettings = () => {
        return \`<div id="dark_console" class="db-console"></div>\`;
    };

    startLiveUpdate = () => {
        this._updateView();
    };

    _updateView = () => {
        const el = document.getElementById('dark_console');
        if (!el) return;
        el.innerHTML = this.logs.slice().reverse().map(l =>
            \`<div class="db-console-line"><span class="db-time">[${l.time}]</span> ${l.message}</div>\`
        ).join('');
    };
}


class DarkUI {
    constructor() {
        this.panel = null;
        this.styleEl = null;
        this.tabs = [];
        this.activeTab = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    createPanel({ id, title, width = 420, height = 400 }) {
        this.styleEl = document.createElement('style');
        this.styleEl.id = 'darkbot-style';
        this.styleEl.textContent = \`
            #darkbot-panel {
                position: fixed; top: 80px; left: 80px;
                width: ${width}px; height: ${height}px;
                background: #2a1a0e; border: 2px solid #8b6914;
                border-radius: 8px; z-index: 99999;
                font-family: Arial, sans-serif; font-size: 13px;
                color: #fc6; box-shadow: 0 8px 32px rgba(0,0,0,0.7);
                display: none; flex-direction: column; overflow: hidden;
            }
            #darkbot-panel.db-visible { display: flex; }

            #darkbot-panel .db-header {
                background: #1a0f06; padding: 10px 14px;
                display: flex; align-items: center; justify-content: space-between;
                cursor: move; user-select: none;
                border-bottom: 2px solid #8b6914; flex-shrink: 0;
            }
            #darkbot-panel .db-header-title {
                font-size: 15px; font-weight: 700; color: #d4a017;
                letter-spacing: 1px;
            }
            #darkbot-panel .db-close {
                background: none; border: none; color: #8b6914;
                font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1;
            }
            #darkbot-panel .db-close:hover { color: #e74c3c; }

            #darkbot-panel .db-tabs {
                display: flex; background: #1a0f06;
                border-bottom: 1px solid rgba(139,105,20,0.4); flex-shrink: 0;
            }
            #darkbot-panel .db-tab {
                padding: 8px 16px; cursor: pointer;
                color: #888; font-size: 11px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.5px;
                border-bottom: 2px solid transparent; transition: all 0.15s;
            }
            #darkbot-panel .db-tab:hover { color: #d4a017; }
            #darkbot-panel .db-tab.db-tab-active {
                color: #fc6; border-bottom-color: #d4a017;
                background: rgba(139,105,20,0.1);
            }

            #darkbot-panel .db-body {
                flex: 1; overflow-y: auto; padding: 12px;
            }
            #darkbot-panel .db-body::-webkit-scrollbar { width: 6px; }
            #darkbot-panel .db-body::-webkit-scrollbar-track { background: #1a0f06; }
            #darkbot-panel .db-body::-webkit-scrollbar-thumb { background: #8b6914; border-radius: 3px; }

            #darkbot-panel .db-section {
                background: rgba(139,105,20,0.08); border-radius: 6px;
                padding: 12px; margin-bottom: 10px;
                border: 1px solid rgba(139,105,20,0.3);
            }
            #darkbot-panel .db-section-title {
                font-size: 13px; font-weight: 700; color: #d4a017;
                margin-bottom: 8px; padding-bottom: 4px;
                border-bottom: 1px solid rgba(139,105,20,0.4);
            }
            #darkbot-panel .db-row {
                display: flex; gap: 6px; margin-bottom: 6px;
                align-items: center; flex-wrap: wrap;
            }
            #darkbot-panel .db-label {
                font-size: 12px; color: #aaa; min-width: 90px; font-weight: 600;
            }

            #darkbot-panel .db-btn {
                padding: 4px 10px; border-radius: 3px;
                border: 1px solid #8b6914; background: #1a1a1a;
                color: #fc6; cursor: pointer; font-size: 11px;
                font-weight: 700; transition: all 0.15s; white-space: nowrap;
            }
            #darkbot-panel .db-btn:hover {
                background: #3a2a10; border-color: #d4a017;
            }
            #darkbot-panel .db-btn.db-btn-active {
                background: #4CAF50; border-color: #4CAF50; color: #fff;
            }
            #darkbot-panel .db-btn.db-btn-danger {
                border-color: #c0392b;
            }
            #darkbot-panel .db-btn.db-btn-danger:hover {
                background: #c0392b; color: #fff;
            }

            #darkbot-panel .db-checkbox {
                display: flex; align-items: center; gap: 8px;
                cursor: pointer; padding: 4px 6px; border-radius: 4px;
                transition: background 0.15s;
            }
            #darkbot-panel .db-checkbox:hover {
                background: rgba(255,255,255,0.08);
            }
            #darkbot-panel .db-checkbox-box {
                width: 16px; height: 16px; border: 2px solid #8b6914;
                border-radius: 3px; display: flex; align-items: center;
                justify-content: center; flex-shrink: 0; transition: all 0.15s;
            }
            #darkbot-panel .db-checkbox.db-on .db-checkbox-box {
                background: #4CAF50; border-color: #4CAF50;
            }
            #darkbot-panel .db-checkbox-check {
                color: #fff; font-size: 11px; font-weight: 700;
                line-height: 1; display: none;
            }
            #darkbot-panel .db-checkbox.db-on .db-checkbox-check {
                display: block;
            }
            #darkbot-panel .db-checkbox-label {
                font-size: 12px; color: #fc6;
            }

            #darkbot-panel .db-status {
                font-size: 11px; color: #aaa; padding: 4px 0;
            }
            #darkbot-panel .db-status.db-status-on { color: #4CAF50; }
            #darkbot-panel .db-status.db-status-off { color: #e74c3c; }

            #darkbot-panel .db-console {
                font-family: Consolas, monospace; font-size: 10px;
                max-height: 200px; overflow-y: auto;
            }
            #darkbot-panel .db-console-line {
                padding: 2px 0; border-bottom: 1px solid rgba(139,105,20,0.15);
                color: #aaa;
            }
            #darkbot-panel .db-console-line .db-time { color: #666; }

            #darkbot-panel .db-footer {
                padding: 8px 12px; border-top: 1px solid rgba(139,105,20,0.4);
                display: flex; justify-content: center; gap: 10px; flex-shrink: 0;
            }
            #darkbot-panel .db-footer-btn {
                cursor: pointer; padding: 6px 16px; border-radius: 4px;
                font-size: 12px; font-weight: 700; color: #fff;
                transition: all 0.15s;
            }
            #darkbot-panel .db-footer-btn.db-close-btn {
                background: #8b6914;
            }
            #darkbot-panel .db-footer-btn.db-close-btn:hover {
                background: #a67c1a;
            }
        \`;
        document.head.appendChild(this.styleEl);

        this.panel = document.createElement('div');
        this.panel.id = 'darkbot-panel';
        this.panel.innerHTML = \`
            <div class="db-header">
                <span class="db-header-title">${title}</span>
                <button class="db-close">&times;</button>
            </div>
            <div class="db-tabs"></div>
            <div class="db-body"></div>
            <div class="db-footer">
                <div class="db-footer-btn db-close-btn">Fechar</div>
            </div>
        \`;

        document.body.appendChild(this.panel);
        this._setupDrag();
        this.panel.querySelector('.db-close').onclick = () => this.hide();
        this.panel.querySelector('.db-close-btn').onclick = () => this.hide();
        return this;
    }

    addTab({ id, label, render, afterRender }) {
        this.tabs.push({ id, label, render, afterRender });
        const tabsEl = this.panel.querySelector('.db-tabs');
        const tab = document.createElement('div');
        tab.className = 'db-tab';
        tab.dataset.tab = id;
        tab.textContent = label;
        tab.onclick = () => this._selectTab(id);
        tabsEl.appendChild(tab);
        if (!this.activeTab) this._selectTab(id);
    }

    _selectTab(id) {
        this.activeTab = id;
        this.panel.querySelectorAll('.db-tab').forEach(t => {
            t.classList.toggle('db-tab-active', t.dataset.tab === id);
        });
        const tab = this.tabs.find(t => t.id === id);
        if (tab) {
            const body = this.panel.querySelector('.db-body');
            body.innerHTML = '';
            const content = document.createElement('div');
            content.innerHTML = tab.render();
            body.appendChild(content);
            if (tab.afterRender) tab.afterRender();
        }
    }

    show() { this.panel.classList.add('db-visible'); }
    hide() { this.panel.classList.remove('db-visible'); }
    toggle() { this.panel.classList.toggle('db-visible'); }
    isVisible() { return this.panel.classList.contains('db-visible'); }
    refresh() { if (this.activeTab) this._selectTab(this.activeTab); }

    _setupDrag() {
        const header = this.panel.querySelector('.db-header');
        header.onmousedown = (e) => {
            if (e.target.classList.contains('db-close')) return;
            this.isDragging = true;
            this.dragOffset.x = e.clientX - this.panel.offsetLeft;
            this.dragOffset.y = e.clientY - this.panel.offsetTop;
        };
        document.onmousemove = (e) => {
            if (!this.isDragging) return;
            this.panel.style.left = (e.clientX - this.dragOffset.x) + 'px';
            this.panel.style.top = (e.clientY - this.dragOffset.y) + 'px';
        };
        document.onmouseup = () => { this.isDragging = false; };
    }

    /* Static helpers para gerar HTML */
    static section(title, content) {
        return \`<div class="db-section"><div class="db-section-title">${title}</div>${content}</div>\`;
    }

    static row(label, buttonsHtml) {
        return \`<div class="db-row"><span class="db-label">${label}</span>${buttonsHtml}</div>\`;
    }

    static btn(id, text, active = false) {
        return \`<div class="db-btn ${active ? 'db-btn-active' : ''}" data-darkbot-btn="${id}">${text}</div>\`;
    }

    static btnDanger(id, text) {
        return \`<div class="db-btn db-btn-danger" data-darkbot-btn="${id}">${text}</div>\`;
    }

    static checkbox(id, label, on = false) {
        return \`<div class="db-checkbox ${on ? 'db-on' : ''}" data-darkbot-check="${id}">
            <div class="db-checkbox-box"><span class="db-checkbox-check">\u2713</span></div>
            <span class="db-checkbox-label">${label}</span>
        </div>\`;
    }

    static status(text, active = false) {
        return \`<div class="db-status ${active ? 'db-status-on' : 'db-status-off'}">${text}</div>\`;
    }

    cleanup = () => {
        if (this.styleEl) this.styleEl.remove();
        if (this.panel) this.panel.remove();
    };
}


class AutoFarm extends DarkUtil {
    constructor(c, s) {
        super(c, s);
        this.timing = this.storage.load('af_timing', 300000);
        this.percent = this.storage.load('af_percent', 1);
        this.active = this.storage.load('af_active', false);
        this.timer = 0;
        this.lastTime = Date.now();
        if (this.active) this.active = setInterval(this.main, 1000);
    }

    setDuration = (ms) => {
        this.timing = ms;
        this.storage.save('af_timing', ms);
        this.updateButtons();
    };

    setPercent = (p) => {
        this.percent = p;
        this.storage.save('af_percent', p);
        this.updateButtons();
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

    updateButtons = () => {
        const panel = document.getElementById('darkbot-darkbot');
        if (!panel) return;

        panel.querySelectorAll('[data-darkbot-btn]').forEach(btn => {
            const id = btn.dataset.darkbotBtn;
            let isActive = false;
            if (id === 'dur_5') isActive = this.timing === 300000;
            if (id === 'dur_10') isActive = this.timing === 600000;
            if (id === 'dur_20') isActive = this.timing === 1200000;
            if (id === 'stor_80') isActive = this.percent === 0.8;
            if (id === 'stor_90') isActive = this.percent === 0.9;
            if (id === 'stor_100') isActive = this.percent === 1;
            btn.classList.toggle('db-btn-active', isActive);
        });

        const toggleEl = panel.querySelector('[data-darkbot-check="af_toggle"]');
        if (toggleEl) toggleEl.classList.toggle('db-on', !!this.active);

        const statusEl = panel.querySelector('#af_status');
        if (statusEl) {
            statusEl.className = this.active ? 'db-status db-status-on' : 'db-status db-status-off';
            statusEl.textContent = this.active ? 'Ativo' : 'Inativo';
        }
    };

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
        const timerEl = document.querySelector('#af_timer');
        if (timerEl) {
            const secs = Math.round(Math.max(this.timer, 0) / 1000);
            const min = Math.floor(secs / 60);
            const sec = secs % 60;
            timerEl.textContent = \`${min}:${sec.toString().padStart(2, '0')}\`;
        }
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
            this.storage.save('af_active', true);
        }
        this.updateTimer();
    };

    claimSingle = (town_id, farm_town_id, relation_id, option = 1) => {
        const data = {
            model_url: \`FarmTownPlayerRelation/${relation_id}\`,
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

    render = () => {
        return DarkUI.section('Auto Farm', \`
            ${DarkUI.checkbox('af_toggle', 'Ativar AutoFarm', this.active)}
            <div id="af_status" class="${this.active ? 'db-status db-status-on' : 'db-status db-status-off'}">
                ${this.active ? 'Ativo' : 'Inativo'}
            </div>
            <div style="margin-top:6px;">
                <span class="db-label">Proxima coleta:</span>
                <span id="af_timer" style="color:#d4a017;font-weight:700;">--:--</span>
            </div>
            ${DarkUI.row('Duracao', \`
                ${DarkUI.btn('dur_5', '5 min', this.timing === 300000)}
                ${DarkUI.btn('dur_10', '10 min', this.timing === 600000)}
                ${DarkUI.btn('dur_20', '20 min', this.timing === 1200000)}
            \`)}
            ${DarkUI.row('Armazenamento', \`
                ${DarkUI.btn('stor_80', '80%', this.percent === 0.8)}
                ${DarkUI.btn('stor_90', '90%', this.percent === 0.9)}
                ${DarkUI.btn('stor_100', '100%', this.percent === 1)}
            \`)}
        \`);
    };

    afterRender = () => {
        const panel = document.getElementById('darkbot-panel');
        if (!panel) return;

        panel.querySelector('[data-darkbot-check="af_toggle"]').onclick = () => this.toggle();

        panel.querySelectorAll('[data-darkbot-btn]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.darkbotBtn;
                if (id === 'dur_5') this.setDuration(300000);
                if (id === 'dur_10') this.setDuration(600000);
                if (id === 'dur_20') this.setDuration(1200000);
                if (id === 'stor_80') this.setPercent(0.8);
                if (id === 'stor_90') this.setPercent(0.9);
                if (id === 'stor_100') this.setPercent(1);
            };
        });

        this.updateTimer();
    };
}


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




        setTimeout(function () {
            window.addEventListener('beforeunload', function () {
                document.querySelectorAll('.darkbot-toggle-btn, #darkbot-panel, #darkbot-style').forEach(function(el) { el.remove(); });
                if (window._darkbotScript) window._darkbotScript.remove();
                if (window._darkbotStyleEl) window._darkbotStyleEl.remove();
                if (window._darkbotObserver) window._darkbotObserver.disconnect();
            });

            const loader = document.getElementById('loader');
            if (loader) {
                const observer = new MutationObserver(function (mutations) {
                    for (const mutation of mutations) {
                        for (const node of mutation.removedNodes) {
                            if (node.id === 'loader') {
                                observer.disconnect();
                                window._darkbotObserver = null;
                                window.darkBot = new DarkBot();
                                return;
                            }
                        }
                    }
                });
                observer.observe(loader.parentElement, { childList: true });
                window._darkbotObserver = observer;
            } else {
                window.darkBot = new DarkBot();
            }
        }, 10);
    })();
`;
    window._darkbotScript = script;
})();