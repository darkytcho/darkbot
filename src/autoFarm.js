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
            this.console.log('off');
        } else {
            this.updateTimer();
            this.active = setInterval(this.main, 1000);
            this.console.log('on');
        }
        this.storage.save('af_active', !!this.active);
        this.updateButtons();
    };

    updateButtons = () => {
        const panel = document.getElementById('_p');
        if (!panel) return;

        panel.querySelectorAll('[data-d]').forEach(btn => {
            const id = btn.dataset.d;
            let isActive = false;
            if (id === 'dur_5') isActive = this.timing === 300000;
            if (id === 'dur_10') isActive = this.timing === 600000;
            if (id === 'dur_20') isActive = this.timing === 1200000;
            if (id === 'stor_80') isActive = this.percent === 0.8;
            if (id === 'stor_90') isActive = this.percent === 0.9;
            if (id === 'stor_100') isActive = this.percent === 1;
            btn.classList.toggle('x-ba', isActive);
        });

        const toggleEl = panel.querySelector('[data-c="af_toggle"]');
        if (toggleEl) toggleEl.classList.toggle('x-on', !!this.active);

        const statusEl = panel.querySelector('#f_s');
        if (statusEl) {
            statusEl.className = this.active ? 'x-st2 x-son' : 'x-st2 x-soff';
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
        const timerEl = document.querySelector('#f_t');
        if (timerEl) {
            const secs = Math.round(Math.max(this.timer, 0) / 1000);
            const min = Math.floor(secs / 60);
            const sec = secs % 60;
            timerEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
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
        for (let town_id of DarkUtil.shuffle(polis_list)) {
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
                    await this.randomDelay(500, 1500);
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
            if (DarkUtil.isLocked()) { this.updateTimer(); return; }
            if (!DarkUtil.acquireLock('autofarm')) { this.updateTimer(); return; }
            clearInterval(this.active);
            this.active = null;
            try {
                await this.randomDelay(1500, 2500);
                await this.claim();
                await this.randomDelay(4000, 6000);
            } finally {
                DarkUtil.releaseLock('autofarm');
            }
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

    render = () => {
        return DarkUI.section('Auto Farm', `
            ${DarkUI.checkbox('af_toggle', 'Ativar AutoFarm', this.active)}
            <div id="f_s" class="${this.active ? 'x-st2 x-son' : 'x-st2 x-soff'}">
                ${this.active ? 'Ativo' : 'Inativo'}
            </div>
            <div style="margin-top:6px;">
                <span class="x-l">Proxima coleta:</span>
                <span id="f_t" style="color:#d4a017;font-weight:700;">--:--</span>
            </div>
            ${DarkUI.row('Duracao', `
                ${DarkUI.btn('dur_5', '5 min', this.timing === 300000)}
                ${DarkUI.btn('dur_10', '10 min', this.timing === 600000)}
                ${DarkUI.btn('dur_20', '20 min', this.timing === 1200000)}
            `)}
            ${DarkUI.row('Armazenamento', `
                ${DarkUI.btn('stor_80', '80%', this.percent === 0.8)}
                ${DarkUI.btn('stor_90', '90%', this.percent === 0.9)}
                ${DarkUI.btn('stor_100', '100%', this.percent === 1)}
            `)}
        `);
    };

    afterRender = () => {
        const panel = document.getElementById('_p');
        if (!panel) return;

        panel.querySelector('[data-c="af_toggle"]').onclick = () => this.toggle();

        panel.querySelectorAll('[data-d]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.d;
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
