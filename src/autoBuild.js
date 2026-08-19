class AutoBuild extends DarkUtil {
    constructor(c, s) {
        super(c, s);
        this.active = this.storage.load('ab_active', false);
        this.groupTargets = this.storage.load('ab_group_targets', { 'default': {} });
        this.selectedGroup = 'default';
        this.selectedTown = null;
        this.demolish = this.storage.load('ab_demolish', false);
        this.priority = [
            'farm', 'main', 'storage', 'lumber', 'stoner', 'ironer',
            'barracks', 'academy', 'temple', 'market', 'wall', 'hide', 'docks'
        ];
        this.buildingNames = {
            main: 'Ed. Principal', farm: 'Fazenda', storage: 'Deposito',
            lumber: 'Bosque', stoner: 'Pedreira', ironer: 'Ferreira',
            barracks: 'Quartel', academy: 'Academia', temple: 'Templo',
            market: 'Mercado', wall: 'Muralha', hide: 'Esconderijo',
            docks: 'Docas'
        };
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
        const groups = [{ id: 'default', name: 'Padrao', townIds: [] }];
        try {
            const tg = uw.ITowns.getTownGroups();
            if (tg) {
                for (const key of Object.keys(tg)) {
                    const g = tg[key];
                    if (!g || g.id <= 0 || g.id === -1) continue;
                    const townIds = g.towns ? Object.keys(g.towns).map(Number) : [];
                    groups.push({ id: 'gp_' + g.id, name: g.name, townIds });
                }
            }
        } catch (e) {}
        if (groups.length === 1) {
            try {
                const collection = uw.MM.getCollections().TownGroup[0];
                if (collection && collection.forEach) {
                    collection.forEach((group) => {
                        const gid = group.getId();
                        if (gid <= 0 || gid === -1) return;
                        groups.push({ id: 'gp_' + gid, name: group.getName(), townIds: [] });
                    });
                }
            } catch (e) {}
        }
        return groups;
    };

    getTowns = () => {
        const towns = uw.ITowns.towns;
        return Object.keys(towns).map(id => ({
            id,
            name: towns[id].attributes.name || ('Cidade ' + id)
        }));
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
        const el = panel.querySelector('[data-ab-target="' + building + '"]');
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
        const buildings = this.selectedTown ? this.getTownBuildings(this.selectedTown) : null;
        container.innerHTML = this.buildBuildingListHTML(targets, buildings);
        this.afterRenderButtons();
    };

    buildBuildingListHTML = (targets, buildings) => {
        return this.priority.map(name => {
            const level = buildings ? (buildings[name] || 0) : '--';
            const target = targets[name] || 0;
            const label = this.buildingNames[name] || name;
            return '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid rgba(139,105,20,0.15);">' +
                '<span style="flex:1;font-size:11px;color:#aaa;">' + label + '</span>' +
                '<span style="font-size:11px;color:#fc6;min-width:24px;text-align:center;" data-ab-level="' + name + '">' + level + '</span>' +
                '<span style="font-size:10px;color:#d4a017;min-width:40px;text-align:center;" data-ab-target="' + name + '">' + (target > 0 ? '-> ' + target : '--') + '</span>' +
                '<div class="db-btn" data-darkbot-btn="ab_lvl_' + name + '_dec" style="padding:2px 6px;font-size:10px;">-</div>' +
                '<div class="db-btn" data-darkbot-btn="ab_lvl_' + name + '_inc" style="padding:2px 6px;font-size:10px;">+</div>' +
                '</div>';
        }).join('');
    };

    getTownBuildings = (town_id) => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return null;
        const buildings = Object.assign({}, town.getBuildings().attributes);
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

    getTownGroupId = (town_id) => {
        try {
            const tg = uw.ITowns.getTownGroups();
            if (tg) {
                for (const key of Object.keys(tg)) {
                    const g = tg[key];
                    if (!g || !g.towns) continue;
                    if (g.towns[town_id] || g.towns[String(town_id)]) return 'gp_' + g.id;
                }
            }
        } catch (e) {}
        try {
            const collection = uw.MM.getCollections().TownGroupTown[0];
            if (collection) {
                const models = collection.models || [];
                for (const m of models) {
                    const attrs = m.attributes || m;
                    if (String(attrs.town_id) === String(town_id)) {
                        return 'gp_' + attrs.group_id;
                    }
                }
            }
        } catch (e) {}
        return 'default';
    };

    getTargetsForTown = (town_id) => {
        const groupId = this.getTownGroupId(town_id);
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
            const res = town.resources();
            const rf = costs.resources_for;
            const pf = costs.population_for;
            if (town.getAvailablePopulation() < pf) return false;
            if (res.wood < rf.wood + this.margin) return false;
            if (res.stone < rf.stone + this.margin) return false;
            if (res.iron < rf.iron + this.margin) return false;
            return true;
        } catch (e) { return false; }
    };

    buildUp = async (town_id, type) => {
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', {
            model_url: 'BuildingOrder',
            action_name: 'buildUp',
            arguments: { building_id: type },
            town_id: town_id,
        });
        this.console.log('AutoBuild: +1 ' + type + ' (cidade ' + town_id + ')');
        await this.sleep(Math.random() * 1500 + 1000);
    };

    tearDown = async (town_id, type) => {
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', {
            model_url: 'BuildingOrder',
            action_name: 'tearDown',
            arguments: { building_id: type },
            town_id: town_id,
        });
        this.console.log('AutoBuild: demolir ' + type + ' (cidade ' + town_id + ')');
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
                return { action: 'build', type: type };
            }
        }
        if (this.demolish) {
            for (const type of this.priority) {
                const target = targets[type];
                if (target === undefined) continue;
                const current = buildings[type] || 0;
                if (current > target) {
                    return { action: 'demolish', type: type };
                }
            }
        }
        return null;
    };

    main = async () => {
        if (!this.active) return;
        var now = Date.now();
        if (now - this.lastBuild < 5000) return;
        try {
            var towns = Object.keys(uw.ITowns.towns);
            for (var i = 0; i < towns.length; i++) {
                var town_id = towns[i];
                if (this.isQueueFull(town_id)) continue;
                var action = this.findNextAction(town_id);
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
            this.console.log('AutoBuild erro: ' + e.message);
        }
    };

    render = () => {
        var groups = this.getGroups();
        var towns = this.getTowns();
        var targets = this.getTargets();
        var buildings = this.selectedTown ? this.getTownBuildings(this.selectedTown) : null;

        var groupOptions = groups.map(function(g) {
            return '<option value="' + g.id + '"' + (g.id === this.selectedGroup ? ' selected' : '') + '>' + g.name + '</option>';
        }.bind(this)).join('');

        var townOptions = '<option value="">-- Selecione --</option>' + towns.map(function(t) {
            return '<option value="' + t.id + '"' + (t.id === this.selectedTown ? ' selected' : '') + '>' + t.name + '</option>';
        }.bind(this)).join('');

        return DarkUI.section('Auto Build',
            DarkUI.checkbox('ab_toggle', 'Ativar AutoBuild', this.active) +
            '<div id="ab_status" class="' + (this.active ? 'db-status db-status-on' : 'db-status db-status-off') + '">' +
                (this.active ? 'Ativo' : 'Inativo') +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">' +
                '<span class="db-label">Cidade:</span>' +
                '<select id="ab_town_select" style="flex:1;background:#1a0f06;border:1px solid #8b6914;border-radius:4px;color:#fc6;padding:4px 8px;font-size:11px;cursor:pointer;">' + townOptions + '</select>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-top:4px;">' +
                '<span class="db-label">Grupo:</span>' +
                '<select id="ab_group_select" style="flex:1;background:#1a0f06;border:1px solid #8b6914;border-radius:4px;color:#fc6;padding:4px 8px;font-size:11px;cursor:pointer;">' + groupOptions + '</select>' +
            '</div>' +
            DarkUI.checkbox('ab_demolish', 'Demolir se acima do nivel', this.demolish) +
            '<div id="ab_building_list" style="margin-top:6px;">' +
                this.buildBuildingListHTML(targets, buildings) +
            '</div>'
        );
    };

    afterRenderButtons = () => {
        var panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        var self = this;
        panel.querySelectorAll('[data-darkbot-btn^="ab_lvl_"]').forEach(function(btn) {
            btn.onclick = function() {
                var id = btn.dataset.darkbotBtn;
                var match = id.match(/^ab_lvl_(.+)_(inc|dec)$/);
                if (!match) return;
                var building = match[1];
                var action = match[2];
                var targets = self.getTargets();
                var current = targets[building] || 0;
                if (action === 'inc') {
                    self.setTarget(building, current + 1);
                } else {
                    self.setTarget(building, Math.max(0, current - 1));
                }
            };
        });
    };

    afterRender = () => {
        var panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        var self = this;

        panel.querySelector('[data-darkbot-check="ab_toggle"]').onclick = function() { self.toggle(); };
        panel.querySelector('[data-darkbot-check="ab_demolish"]').onclick = function() { self.toggleDemolish(); };

        panel.querySelector('#ab_group_select').onchange = function(e) {
            self.selectedGroup = e.target.value;
            self.refreshBuildingList();
        };

        panel.querySelector('#ab_town_select').onchange = function(e) {
            self.selectedTown = e.target.value || null;
            self.refreshBuildingList();
        };

        this.afterRenderButtons();
        this.updateToggleUI();
    };
}
