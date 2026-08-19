class AutoBuild extends DarkUtil {
    constructor(c, s) {
        super(c, s);
        this.active = this.storage.load('ab_active', false);
        this.groupTargets = this.storage.load('ab_group_targets', { 'default': {} });
        this.selectedGroup = 'default';
        this.demolish = this.storage.load('ab_demolish', false);
        this.priority = [
            'farm', 'main', 'storage', 'lumber', 'stoner', 'ironer',
            'barracks', 'academy', 'temple', 'market', 'wall', 'hide', 'docks'
        ];
        this.margin = 20;
        this.interval = null;
        this.lastBuild = 0;
        if (this.active) this.start();
    }

    start = () => {
        this.interval = setInterval(this.main, 20000);
        this.main();
    };

    stop = () => {
        if (this.interval) clearInterval(this.interval);
        this.interval = null;
    };

    toggle = () => {
        if (this.active) {
            this.stop();
            this.active = false;
            this.console.log('AutoBuild desativado');
        } else {
            this.active = true;
            this.start();
            this.console.log('AutoBuild ativado');
        }
        this.storage.save('ab_active', this.active);
        this.updateToggleUI();
    };

    toggleDemolish = () => {
        this.demolish = !this.demolish;
        this.storage.save('ab_demolish', this.demolish);
        this.updateToggleUI();
    };

    getGroups = () => {
        const groups = [{ id: 'default', name: 'Padrao' }];
        try {
            if (typeof uw !== 'undefined' && uw.ITowns && uw.ITowns.townGroups) {
                const models = uw.ITowns.townGroups.models || uw.ITowns.townGroups;
                if (models && models.length) {
                    for (const model of models) {
                        const attrs = model.attributes || model;
                        groups.push({ id: 'gp_' + attrs.id, name: attrs.name || ('Grupo ' + attrs.id) });
                    }
                }
            }
        } catch (e) {}
        return groups;
    };

    getTargets = () => {
        return this.groupTargets[this.selectedGroup] || {};
    };

    setTarget = (building, level) => {
        if (!this.groupTargets[this.selectedGroup]) {
            this.groupTargets[this.selectedGroup] = {};
        }
        if (level <= 0) {
            delete this.groupTargets[this.selectedGroup][building];
        } else {
            this.groupTargets[this.selectedGroup][building] = level;
        }
        this.storage.save('ab_group_targets', this.groupTargets);
        this.updateTargetDisplay(building);
    };

    updateTargetDisplay = (building) => {
        const panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        const targets = this.getTargets();
        const target = targets[building] || 0;
        const el = panel.querySelector(`[data-ab-target="${building}"]`);
        if (el) el.textContent = target > 0 ? '-> ' + target : '--';
    };

    updateToggleUI = () => {
        const panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        const toggleEl = panel.querySelector('[data-darkbot-check="ab_toggle"]');
        if (toggleEl) toggleEl.classList.toggle('db-on', this.active);
        const statusEl = panel.querySelector('#ab_status');
        if (statusEl) {
            statusEl.className = this.active ? 'db-status db-status-on' : 'db-status db-status-off';
            statusEl.textContent = this.active ? 'Ativo' : 'Inativo';
        }
        const demoEl = panel.querySelector('[data-darkbot-check="ab_demolish"]');
        if (demoEl) demoEl.classList.toggle('db-on', this.demolish);
    };

    refreshBuildingList = () => {
        const panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        const container = panel.querySelector('#ab_building_list');
        if (!container) return;
        const targets = this.getTargets();
        container.innerHTML = this.buildBuildingListHTML(targets);
    };

    buildBuildingListHTML = (targets) => {
        const buildingNames = {
            main: 'Ed. Principal', farm: 'Fazenda', storage: 'Deposito',
            lumber: 'Bosque', stoner: 'Pedreira', ironer: 'Ferreira',
            barracks: 'Quartel', academy: 'Academia', temple: 'Templo',
            market: 'Mercado', wall: 'Muralha', hide: 'Esconderijo',
            docks: 'Docas'
        };
        return this.priority.map(name => {
            const { avg } = this.getBuildingDisplay(name);
            const target = targets[name] || 0;
            const label = buildingNames[name] || name;
            return `
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid rgba(139,105,20,0.15);">
                    <span style="flex:1;font-size:11px;color:#aaa;">${label}</span>
                    <span style="font-size:11px;color:#666;min-width:24px;text-align:center;">${avg}</span>
                    <span style="font-size:10px;color:#d4a017;min-width:40px;text-align:center;" data-ab-target="${name}">${target > 0 ? '-> ' + target : '--'}</span>
                    <div class="db-btn" data-darkbot-btn="ab_lvl_${name}_dec" style="padding:2px 6px;font-size:10px;">-</div>
                    <div class="db-btn" data-darkbot-btn="ab_lvl_${name}_inc" style="padding:2px 6px;font-size:10px;">+</div>
                </div>
            `;
        }).join('');
    };

    getTownBuildings = (town_id) => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return null;
        const buildings = { ...town.getBuildings().attributes };
        for (const order of town.buildingOrders().models) {
            const type = order.attributes.building_type;
            if (order.attributes.tear_down) {
                buildings[type] = (buildings[type] || 0) - 1;
            } else {
                buildings[type] = (buildings[type] || 0) + 1;
            }
        }
        return buildings;
    };

    getTownGroup = (town_id) => {
        try {
            if (uw.ITowns.townGroups && uw.ITowns.townGroups.models) {
                for (const model of uw.ITowns.townGroups.models) {
                    const townIds = model.attributes.town_ids || [];
                    if (townIds.includes(Number(town_id))) {
                        return 'gp_' + model.attributes.id;
                    }
                }
            }
        } catch (e) {}
        return 'default';
    };

    getTargetsForTown = (town_id) => {
        const groupId = this.getTownGroup(town_id);
        return this.groupTargets[groupId] || this.groupTargets['default'] || {};
    };

    isQueueFull = (town_id) => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return true;
        let max = 2;
        try {
            if (uw.GameDataPremium && uw.GameDataPremium.isAdvisorActivated('curator')) max = 7;
        } catch (e) {}
        return town.buildingOrders().length >= max;
    };

    canAfford = (town_id, type) => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return false;
        try {
            const buildData = uw.MM.getModels().BuildingBuildData[town_id];
            if (!buildData) return false;
            const costs = buildData.attributes.building_data[type];
            if (!costs) return false;
            const { wood, stone, iron } = town.resources();
            const { resources_for, population_for } = costs;
            if (town.getAvailablePopulation() < population_for) return false;
            if (wood < resources_for.wood + this.margin) return false;
            if (stone < resources_for.stone + this.margin) return false;
            if (iron < resources_for.iron + this.margin) return false;
            return true;
        } catch (e) { return false; }
    };

    buildUp = async (town_id, type) => {
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', {
            model_url: 'BuildingOrder',
            action_name: 'buildUp',
            arguments: { building_id: type },
            town_id,
        });
        this.console.log(`AutoBuild: +1 ${type} (cidade ${town_id})`);
        await this.sleep(Math.random() * 1500 + 1000);
    };

    tearDown = async (town_id, type) => {
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', {
            model_url: 'BuildingOrder',
            action_name: 'tearDown',
            arguments: { building_id: type },
            town_id,
        });
        this.console.log(`AutoBuild: demolir ${type} (cidade ${town_id})`);
        await this.sleep(Math.random() * 1500 + 1000);
    };

    findNextAction = (town_id) => {
        const buildings = this.getTownBuildings(town_id);
        if (!buildings) return null;
        const targets = this.getTargetsForTown(town_id);
        for (const type of this.priority) {
            const target = targets[type];
            if (target === undefined) continue;
            const current = buildings[type] || 0;
            if (current < target && this.canAfford(town_id, type)) {
                return { action: 'build', type };
            }
        }
        if (this.demolish) {
            for (const type of this.priority) {
                const target = targets[type];
                if (target === undefined) continue;
                const current = buildings[type] || 0;
                if (current > target) {
                    return { action: 'demolish', type };
                }
            }
        }
        return null;
    };

    main = async () => {
        if (!this.active) return;
        const now = Date.now();
        if (now - this.lastBuild < 5000) return;
        try {
            const towns = Object.keys(uw.ITowns.towns);
            for (const town_id of towns) {
                if (this.isQueueFull(town_id)) continue;
                const action = this.findNextAction(town_id);
                if (!action) continue;
                this.lastBuild = Date.now();
                if (action.action === 'build') {
                    await this.buildUp(town_id, action.type);
                } else {
                    await this.tearDown(town_id, action.type);
                }
                return;
            }
        } catch (e) {
            this.console.log(`AutoBuild erro: ${e.message}`);
        }
    };

    getBuildingDisplay = (name) => {
        const towns = Object.keys(uw.ITowns.towns);
        let totalLevel = 0, count = 0;
        for (const town_id of towns) {
            const buildings = this.getTownBuildings(town_id);
            if (buildings) {
                totalLevel += buildings[name] || 0;
                count++;
            }
        }
        return { avg: count > 0 ? Math.round(totalLevel / count) : 0 };
    };

    render = () => {
        const groups = this.getGroups();
        const targets = this.getTargets();
        const groupOptions = groups.map(g =>
            `<option value="${g.id}" ${g.id === this.selectedGroup ? 'selected' : ''}>${g.name}</option>`
        ).join('');
        return DarkUI.section('Auto Build', `
            ${DarkUI.checkbox('ab_toggle', 'Ativar AutoBuild', this.active)}
            <div id="ab_status" class="${this.active ? 'db-status db-status-on' : 'db-status db-status-off'}">
                ${this.active ? 'Ativo' : 'Inativo'}
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:8px;">
                <span class="db-label">Grupo:</span>
                <select id="ab_group_select" style="
                    background:#1a0f06;border:1px solid #8b6914;border-radius:4px;
                    color:#fc6;padding:4px 8px;font-size:11px;cursor:pointer;
                ">${groupOptions}</select>
            </div>
            ${DarkUI.checkbox('ab_demolish', 'Demolir se acima do nivel', this.demolish)}
            <div id="ab_building_list" style="margin-top:6px;">
                ${this.buildBuildingListHTML(targets)}
            </div>
        `);
    };

    afterRender = () => {
        const panel = document.getElementById('darkbot-panel');
        if (!panel) return;

        panel.querySelector('[data-darkbot-check="ab_toggle"]').onclick = () => this.toggle();
        panel.querySelector('[data-darkbot-check="ab_demolish"]').onclick = () => this.toggleDemolish();

        panel.querySelector('#ab_group_select').onchange = (e) => {
            this.selectedGroup = e.target.value;
            this.refreshBuildingList();
        };

        panel.querySelectorAll('[data-darkbot-btn]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.darkbotBtn;
                const match = id.match(/^ab_lvl_(.+)_(inc|dec)$/);
                if (!match) return;
                const building = match[1];
                const action = match[2];
                const targets = this.getTargets();
                const current = targets[building] || 0;
                if (action === 'inc') {
                    this.setTarget(building, current + 1);
                } else {
                    this.setTarget(building, Math.max(0, current - 1));
                }
            };
        });

        this.updateToggleUI();
    };
}
