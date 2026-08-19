class AutoBuild extends DarkUtil {
    constructor(c, s) {
        super(c, s);
        this.active = this.storage.load('ab_active', false);
        this.targets = this.storage.load('ab_targets', {});
        this.priority = [
            'farm', 'main', 'storage', 'lumber', 'stoner', 'ironer',
            'barracks', 'academy', 'temple', 'market', 'wall', 'hide', 'docks'
        ];
        this.margin = 20;
        this.interval = null;
        this.lastBuild = 0;
        this.logs = [];
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
        this.updateUI();
    };

    setTarget = (building, level) => {
        if (level <= 0) {
            delete this.targets[building];
        } else {
            this.targets[building] = level;
        }
        this.storage.save('ab_targets', this.targets);
        this.updateUI();
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

    isQueueFull = (town_id) => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return true;
        const hasCurator = typeof uw.GameDataPremium !== 'undefined' &&
            uw.GameDataPremium.isAdvisorActivated('curator');
        const max = hasCurator ? 7 : 2;
        return town.buildingOrders().length >= max;
    };

    canAfford = (town_id, type) => {
        const town = uw.ITowns.getTown(town_id);
        if (!town) return false;
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
    };

    buildUp = async (town_id, type) => {
        uw.gpAjax.ajaxPost('frontend_bridge', 'execute', {
            model_url: 'BuildingOrder',
            action_name: 'buildUp',
            arguments: { building_id: type },
            town_id,
        });
        this.console.log(`AutoBuild: ${type} em cidade ${town_id}`);
        await this.sleep(Math.random() * 1500 + 1000);
    };

    findNextBuild = (town_id) => {
        const buildings = this.getTownBuildings(town_id);
        if (!buildings) return null;
        for (const type of this.priority) {
            const target = this.targets[type];
            if (target === undefined) continue;
            const current = buildings[type] || 0;
            if (current < target && this.canAfford(town_id, type)) {
                return type;
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
                const build = this.findNextBuild(town_id);
                if (!build) continue;
                this.lastBuild = Date.now();
                await this.buildUp(town_id, build);
            }
        } catch (e) {
            this.console.log(`AutoBuild erro: ${e.message}`);
        }
    };

    getBuildingDisplay = (name) => {
        const towns = Object.keys(uw.ITowns.towns);
        let totalLevel = 0;
        let count = 0;
        for (const town_id of towns) {
            const buildings = this.getTownBuildings(town_id);
            if (buildings) {
                totalLevel += buildings[name] || 0;
                count++;
            }
        }
        const avg = count > 0 ? Math.round(totalLevel / count) : 0;
        const target = this.targets[name] || 0;
        return { avg, target };
    };

    updateUI = () => {
        const panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        const toggleEl = panel.querySelector('[data-darkbot-check="ab_toggle"]');
        if (toggleEl) toggleEl.classList.toggle('db-on', this.active);
        const statusEl = panel.querySelector('#ab_status');
        if (statusEl) {
            statusEl.className = this.active ? 'db-status db-status-on' : 'db-status db-status-off';
            statusEl.textContent = this.active ? 'Ativo' : 'Inativo';
        }
    };

    render = () => {
        const buildingNames = {
            main: 'Ed. Principal', farm: 'Fazenda', storage: 'Deposito',
            lumber: 'Bosque', stoner: 'Pedreira', ironer: 'Ferreira',
            barracks: 'Quartel', academy: 'Academia', temple: 'Templo',
            market: 'Mercado', wall: 'Muralha', hide: 'Esconderijo',
            docks: 'Docas'
        };
        let buildingList = '';
        for (const name of this.priority) {
            const { avg, target } = this.getBuildingDisplay(name);
            const label = buildingNames[name] || name;
            const hasTarget = target > 0;
            buildingList += `
                <div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid rgba(139,105,20,0.15);">
                    <span style="flex:1;font-size:11px;color:#aaa;">${label}</span>
                    <span style="font-size:11px;color:#666;min-width:30px;text-align:center;">${avg}</span>
                    <span style="font-size:10px;color:#666;">${hasTarget ? '->' + target : '--'}</span>
                    <div class="db-btn" data-darkbot-btn="ab_lvl_${name}_dec" style="padding:2px 6px;font-size:10px;">-</div>
                    <div class="db-btn" data-darkbot-btn="ab_lvl_${name}_inc" style="padding:2px 6px;font-size:10px;">+</div>
                </div>
            `;
        }
        return DarkUI.section('Auto Build', `
            ${DarkUI.checkbox('ab_toggle', 'Ativar AutoBuild', this.active)}
            <div id="ab_status" class="${this.active ? 'db-status db-status-on' : 'db-status db-status-off'}">
                ${this.active ? 'Ativo' : 'Inativo'}
            </div>
            <div style="margin-top:8px;font-size:10px;color:#666;">
                Clique + para definir nivel alvo, - para remover
            </div>
            <div style="margin-top:4px;">
                ${buildingList}
            </div>
        `);
    };

    afterRender = () => {
        const panel = document.getElementById('darkbot-panel');
        if (!panel) return;
        panel.querySelector('[data-darkbot-check="ab_toggle"]').onclick = () => this.toggle();
        panel.querySelectorAll('[data-darkbot-btn]').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.darkbotBtn;
                const match = id.match(/^ab_lvl_(.+)_(inc|dec)$/);
                if (!match) return;
                const building = match[1];
                const action = match[2];
                const current = this.targets[building] || 0;
                if (action === 'inc') {
                    this.setTarget(building, current + 1);
                } else {
                    this.setTarget(building, Math.max(0, current - 1));
                }
            };
        });
        this.updateUI();
    };
}
