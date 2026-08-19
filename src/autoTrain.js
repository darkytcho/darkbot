class AutoTrain extends DarkUtil {
    constructor(c, s) {
        super(c, s);
        this.active = this.storage.load('at_active', false);
        this.groupTargets = this.storage.load('at_group_targets', { 'default': {} });
        this.selectedGroup = 'default';
        this.selectedTown = null;
        this.units = [
            'sword', 'archer', 'slinger', 'hoplite',
            'knight', 'chariot',
            'bireme', 'fire_ship', 'trireme', 'transport_ship', 'big_transport_ship'
        ];
        this.unitNames = {
            sword: 'Espadachim', archer: 'Arqueiro', slinger: 'Fundi.',
            hoplite: 'Hoplita', knight: 'Cavaleiro', chariot: 'Biga',
            bireme: 'Birreme', fire_ship: 'Navio-fogo', trireme: 'Trirreme',
            transport_ship: 'Transp.', big_transport_ship: 'Grande Transp.'
        };
        this.unitBuildings = {
            sword: 'barracks', archer: 'barracks', slinger: 'barracks', hoplite: 'barracks',
            knight: 'stable', chariot: 'stable',
            bireme: 'docks', fire_ship: 'docks', trireme: 'docks',
            transport_ship: 'docks', big_transport_ship: 'docks'
        };
        this.interval = null;
        this.lastTrain = 0;
        this.lastTown = null;
        if (this.active) this.start();
    }

    start = () => {
        this.interval = setInterval(this.main, 3000);
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
            this.console.log('AutoTrain desativado');
        } else {
            this.active = true;
            this.start();
            this.console.log('AutoTrain ativado');
        }
        this.storage.save('at_active', this.active);
        this.updateToggleUI();
    };

    getGroups = () => {
        var groups = [{ id: 'default', name: 'Padrao', townIds: [] }];
        try {
            var tg = uw.ITowns.getTownGroups();
            if (tg) {
                var keys = Object.keys(tg);
                for (var i = 0; i < keys.length; i++) {
                    var g = tg[keys[i]];
                    if (!g || g.id <= 0 || g.id === -1) continue;
                    groups.push({ id: 'gp_' + g.id, name: g.name, townIds: [] });
                }
            }
        } catch (e) {}
        return groups;
    };

    getTowns = () => {
        try {
            var towns = uw.ITowns.towns;
            if (!towns) return [];
            return Object.keys(towns).map(function(id) {
                return {
                    id: id,
                    name: (towns[id] && towns[id].attributes && towns[id].attributes.name) || ('Cidade ' + id)
                };
            });
        } catch (e) { return []; }
    };

    getTargets = () => {
        return this.groupTargets[this.selectedGroup] || {};
    };

    setTarget = (unit, count) => {
        if (!this.groupTargets[this.selectedGroup]) {
            this.groupTargets[this.selectedGroup] = {};
        }
        if (count <= 0) {
            delete this.groupTargets[this.selectedGroup][unit];
        } else {
            this.groupTargets[this.selectedGroup][unit] = count;
        }
        this.storage.save('at_group_targets', this.groupTargets);
        this.updateTargetDisplay(unit);
    };

    updateTargetDisplay = (unit) => {
        var panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        var targets = this.getTargets();
        var el = panel.querySelector('[data-at-input="' + unit + '"]');
        if (el) el.value = targets[unit] || 0;
    };

    updateToggleUI = () => {
        var panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        var toggleEl = panel.querySelector('[data-darkbot-check="at_toggle"]');
        if (toggleEl) toggleEl.classList.toggle('db-on', this.active);
        var statusEl = panel.querySelector('#at_status');
        if (statusEl) {
            statusEl.className = this.active ? 'db-status db-status-on' : 'db-status db-status-off';
            statusEl.textContent = this.active ? 'Ativo' : 'Inativo';
        }
    };

    refreshUnitList = () => {
        var panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        var container = panel.querySelector('#at_unit_list');
        if (!container) return;
        var targets = this.getTargets();
        var counts = this.selectedTown ? this.getTownUnits(this.selectedTown) : null;
        container.innerHTML = this.buildUnitListHTML(targets, counts);
        this.afterRenderInputs();
    };

    buildUnitListHTML = (targets, counts) => {
        var self = this;
        var land = this.units.filter(function(u) {
            return self.unitBuildings[u] !== 'docks';
        });
        var naval = this.units.filter(function(u) {
            return self.unitBuildings[u] === 'docks';
        });

        var html = '<div style="font-size:10px;color:#8b6914;margin-bottom:3px;">Terra</div>';
        html += this.buildUnitRows(land, targets, counts);
        html += '<div style="font-size:10px;color:#8b6914;margin-top:6px;margin-bottom:3px;">Naval</div>';
        html += this.buildUnitRows(naval, targets, counts);
        return html;
    };

    buildUnitRows = (unitList, targets, counts) => {
        return unitList.map(function(name) {
            var current = counts ? (counts[name] || 0) : '--';
            var target = targets[name] || 0;
            var label = this.unitNames[name] || name;
            return '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid rgba(139,105,20,0.15);">' +
                '<span style="flex:1;font-size:11px;color:#aaa;">' + label + '</span>' +
                '<span style="font-size:11px;color:#fc6;min-width:24px;text-align:center;" data-at-count="' + name + '">' + current + '</span>' +
                '<input type="number" min="0" max="500" value="' + target + '" data-at-input="' + name + '" ' +
                    'style="width:50px;background:#1a0f06;border:1px solid #8b6914;border-radius:3px;color:#d4a017;text-align:center;font-size:11px;padding:2px 3px;">' +
                '</div>';
        }.bind(this)).join('');
    };

    getTownUnits = (town_id) => {
        try {
            var town = uw.ITowns.getTown(town_id);
            if (!town) return null;
            var units = {};
            try {
                var land = town.getLandUnits();
                if (land) Object.assign(units, land);
            } catch (e) {}
            try {
                var all = town.units();
                if (all) {
                    var keys = Object.keys(all);
                    for (var i = 0; i < keys.length; i++) {
                        if (units[keys[i]] === undefined) units[keys[i]] = all[keys[i]];
                    }
                }
            } catch (e) {}
            return units;
        } catch (e) { return null; }
    };

    getTownGroupId = (town_id) => {
        try {
            var tg = uw.ITowns.getTownGroups();
            if (tg) {
                var keys = Object.keys(tg);
                for (var i = 0; i < keys.length; i++) {
                    var g = tg[keys[i]];
                    if (!g || !g.towns) continue;
                    if (g.towns[town_id] || g.towns[String(town_id)]) return 'gp_' + g.id;
                }
            }
        } catch (e) {}
        return 'default';
    };

    getTargetsForTown = (town_id) => {
        var groupId = this.getTownGroupId(town_id);
        return this.groupTargets[groupId] || this.groupTargets['default'] || {};
    };

    getBuildingLevel = (town_id, building) => {
        try {
            var town = uw.ITowns.getTown(town_id);
            if (!town) return 0;
            var b = town.getBuildings();
            return (b && b.attributes && b.attributes[building]) || 0;
        } catch (e) { return 0; }
    };

    canTrain = (town_id, unit) => {
        try {
            var town = uw.ITowns.getTown(town_id);
            if (!town) return false;
            var building = this.unitBuildings[unit];
            if (!building) return false;
            if (this.getBuildingLevel(town_id, building) < 1) return false;
            var unitData = uw.GameData.units[unit];
            if (!unitData) return false;
            var res = town.resources();
            var costs = unitData.resources || unitData.costs;
            if (!costs) return false;
            if (res.wood < (costs.wood || 0)) return false;
            if (res.stone < (costs.stone || 0)) return false;
            if (res.iron < (costs.iron || 0)) return false;
            var pop = unitData.population || 0;
            if (town.getAvailablePopulation() < pop) return false;
            return true;
        } catch (e) { return false; }
    };

    getTrainQueueLength = (town_id) => {
        try {
            var town = uw.ITowns.getTown(town_id);
            if (!town) return 999;
            if (typeof town.getUnitOrdersCount === 'function') return town.getUnitOrdersCount();
            return 0;
        } catch (e) { return 999; }
    };

    trainUnit = (town_id, unit) => {
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', {
            model_url: 'UnitOrder',
            action_name: 'build',
            arguments: { unit_id: unit },
            town_id: town_id,
        });
        this.console.log('AutoTrain: ' + unit + ' (cidade ' + town_id + ')');
    };

    findNextAction = (town_id) => {
        var counts = this.getTownUnits(town_id);
        if (!counts) return null;
        var targets = this.getTargetsForTown(town_id);
        var land = ['sword', 'archer', 'slinger', 'hoplite', 'knight', 'chariot'];
        var naval = ['bireme', 'fire_ship', 'trireme', 'transport_ship', 'big_transport_ship'];
        var all = land.concat(naval);

        for (var i = 0; i < all.length; i++) {
            var unit = all[i];
            var target = targets[unit];
            if (target === undefined) continue;
            var current = counts[unit] || 0;
            if (current < target && this.canTrain(town_id, unit)) {
                return { unit: unit };
            }
        }
        return null;
    };

    main = async () => {
        if (!this.active) return;
        var now = Date.now();
        if (now - this.lastTrain < 3000) return;
        if (DarkUtil.isLocked()) return;
        try {
            var towns = Object.keys(uw.ITowns.towns);
            for (var i = 0; i < towns.length; i++) {
                var town_id = towns[i];
                var action = this.findNextAction(town_id);
                if (!action) continue;
                if (!DarkUtil.acquireLock('autotrain')) return;
                var changedCity = this.lastTown !== null && this.lastTown !== town_id;
                this.lastTown = town_id;
                this.lastTrain = Date.now();
                try {
                    if (changedCity) {
                        this.console.log('AutoTrain: trocou cidade, aguardando 5s...');
                        await this.randomDelay(5000, 1000);
                    }
                    await this.randomDelay(1500, 1500);
                    this.trainUnit(town_id, action.unit);
                    await this.randomDelay(2000, 2000);
                } finally {
                    DarkUtil.releaseLock('autotrain');
                }
                return;
            }
        } catch (e) {
            DarkUtil.releaseLock('autotrain');
            this.console.log('AutoTrain erro: ' + e.message);
        }
    };

    render = () => {
        var groups = this.getGroups();
        var towns = this.getTowns();
        var targets = this.getTargets();
        var counts = this.selectedTown ? this.getTownUnits(this.selectedTown) : null;

        var groupOptions = groups.map(function(g) {
            return '<option value="' + g.id + '"' + (g.id === this.selectedGroup ? ' selected' : '') + '>' + g.name + '</option>';
        }.bind(this)).join('');

        var townOptions = '<option value="">-- Selecione --</option>' + towns.map(function(t) {
            return '<option value="' + t.id + '"' + (t.id === this.selectedTown ? ' selected' : '') + '>' + t.name + '</option>';
        }.bind(this)).join('');

        return DarkUI.section('Auto Train',
            DarkUI.checkbox('at_toggle', 'Ativar AutoTrain', this.active) +
            '<div id="at_status" class="' + (this.active ? 'db-status db-status-on' : 'db-status db-status-off') + '">' +
                (this.active ? 'Ativo' : 'Inativo') +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">' +
                '<span class="db-label">Cidade:</span>' +
                '<select id="at_town_select" style="flex:1;background:#1a0f06;border:1px solid #8b6914;border-radius:4px;color:#fc6;padding:4px 8px;font-size:11px;cursor:pointer;">' + townOptions + '</select>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;margin-top:4px;">' +
                '<span class="db-label">Grupo:</span>' +
                '<select id="at_group_select" style="flex:1;background:#1a0f06;border:1px solid #8b6914;border-radius:4px;color:#fc6;padding:4px 8px;font-size:11px;cursor:pointer;">' + groupOptions + '</select>' +
            '</div>' +
            '<div id="at_unit_list" style="margin-top:6px;">' +
                this.buildUnitListHTML(targets, counts) +
            '</div>'
        );
    };

    afterRenderInputs = () => {
        var panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        var self = this;
        panel.querySelectorAll('[data-at-input]').forEach(function(input) {
            var unit = input.dataset.atInput;
            input.onchange = function() {
                var val = parseInt(input.value, 10);
                if (isNaN(val) || val < 0) val = 0;
                if (val > 500) val = 500;
                self.setTarget(unit, val);
            };
        });
    };

    afterRender = () => {
        var panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        var self = this;

        panel.querySelector('[data-darkbot-check="at_toggle"]').onclick = function() { self.toggle(); };

        panel.querySelector('#at_group_select').onchange = function(e) {
            self.selectedGroup = e.target.value;
            self.refreshUnitList();
        };

        panel.querySelector('#at_town_select').onchange = function(e) {
            self.selectedTown = e.target.value || null;
            self.refreshUnitList();
        };

        this.afterRenderInputs();
        this.updateToggleUI();
    };
}
