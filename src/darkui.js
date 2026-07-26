class DarkUI {
    constructor() {
        this.panel = null;
        this.tabs = [];
        this.activeTab = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    createPanel({ id, title, width = 420, height = 400 }) {
        const style = document.createElement('style');
        style.textContent = `
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
        `;
        document.head.appendChild(style);

        this.panel = document.createElement('div');
        this.panel.id = 'darkbot-panel';
        this.panel.innerHTML = `
            <div class="db-header">
                <span class="db-header-title">${title}</span>
                <button class="db-close">&times;</button>
            </div>
            <div class="db-tabs"></div>
            <div class="db-body"></div>
            <div class="db-footer">
                <div class="db-footer-btn db-close-btn">Fechar</div>
            </div>
        `;

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
        return `<div class="db-section"><div class="db-section-title">${title}</div>${content}</div>`;
    }

    static row(label, buttonsHtml) {
        return `<div class="db-row"><span class="db-label">${label}</span>${buttonsHtml}</div>`;
    }

    static btn(id, text, active = false) {
        return `<div class="db-btn ${active ? 'db-btn-active' : ''}" data-darkbot-btn="${id}">${text}</div>`;
    }

    static btnDanger(id, text) {
        return `<div class="db-btn db-btn-danger" data-darkbot-btn="${id}">${text}</div>`;
    }

    static checkbox(id, label, on = false) {
        return `<div class="db-checkbox ${on ? 'db-on' : ''}" data-darkbot-check="${id}">
            <div class="db-checkbox-box"><span class="db-checkbox-check">\u2713</span></div>
            <span class="db-checkbox-label">${label}</span>
        </div>`;
    }

    static status(text, active = false) {
        return `<div class="db-status ${active ? 'db-status-on' : 'db-status-off'}">${text}</div>`;
    }
}
