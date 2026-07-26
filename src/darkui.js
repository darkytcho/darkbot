class DarkUI {
    constructor() {
        this.panel = null;
        this.tabs = [];
        this.activeTab = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    createPanel({ id, title, width = 420, height = 400 }) {
        this.panel = document.createElement('div');
        this.panel.id = `darkbot-${id}`;
        this.panel.innerHTML = `
            <style>
                #darkbot-${id} {
                    position: fixed; top: 80px; left: 80px;
                    width: ${width}px; height: ${height}px;
                    background: #1a1a2e; border: 1px solid #16213e;
                    border-radius: 8px; z-index: 99999;
                    font-family: 'Segoe UI', Arial, sans-serif;
                    font-size: 12px; color: #e0e0e0;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
                    display: none; flex-direction: column;
                    overflow: hidden;
                }
                #darkbot-${id}.darkbot-visible { display: flex; }

                #darkbot-${id} .db-header {
                    background: #0f3460; padding: 10px 14px;
                    display: flex; align-items: center; justify-content: space-between;
                    cursor: move; user-select: none;
                    border-bottom: 2px solid #e94560;
                    flex-shrink: 0;
                }
                #darkbot-${id} .db-header-title {
                    font-size: 14px; font-weight: 700; color: #fff;
                    letter-spacing: 1px;
                }
                #darkbot-${id} .db-close {
                    background: none; border: none; color: #999;
                    font-size: 18px; cursor: pointer; padding: 0 4px;
                    line-height: 1;
                }
                #darkbot-${id} .db-close:hover { color: #e94560; }

                #darkbot-${id} .db-tabs {
                    display: flex; background: #16213e;
                    border-bottom: 1px solid #0f3460;
                    flex-shrink: 0;
                }
                #darkbot-${id} .db-tab {
                    padding: 8px 16px; cursor: pointer;
                    color: #888; font-size: 11px; font-weight: 600;
                    text-transform: uppercase; letter-spacing: 0.5px;
                    border-bottom: 2px solid transparent;
                    transition: all 0.15s;
                }
                #darkbot-${id} .db-tab:hover { color: #ccc; }
                #darkbot-${id} .db-tab.db-tab-active {
                    color: #e94560; border-bottom-color: #e94560;
                }

                #darkbot-${id} .db-body {
                    flex: 1; overflow-y: auto; padding: 12px;
                }
                #darkbot-${id} .db-body::-webkit-scrollbar { width: 6px; }
                #darkbot-${id} .db-body::-webkit-scrollbar-track { background: #1a1a2e; }
                #darkbot-${id} .db-body::-webkit-scrollbar-thumb { background: #0f3460; border-radius: 3px; }

                #darkbot-${id} .db-section {
                    background: #16213e; border-radius: 6px;
                    padding: 12px; margin-bottom: 10px;
                    border: 1px solid #1a1a3e;
                }
                #darkbot-${id} .db-section-title {
                    font-size: 12px; font-weight: 700; color: #e94560;
                    margin-bottom: 8px; text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                #darkbot-${id} .db-row {
                    display: flex; gap: 6px; margin-bottom: 6px;
                    align-items: center; flex-wrap: wrap;
                }
                #darkbot-${id} .db-label {
                    font-size: 11px; color: #999; min-width: 80px;
                    font-weight: 600;
                }

                #darkbot-${id} .db-btn {
                    padding: 5px 12px; border-radius: 4px;
                    border: 1px solid #333; background: #222;
                    color: #ccc; cursor: pointer; font-size: 11px;
                    font-weight: 600; transition: all 0.15s;
                    white-space: nowrap;
                }
                #darkbot-${id} .db-btn:hover { background: #333; border-color: #555; color: #fff; }
                #darkbot-${id} .db-btn.db-btn-active {
                    background: #e94560; border-color: #e94560; color: #fff;
                }
                #darkbot-${id} .db-btn.db-btn-disabled {
                    opacity: 0.4; pointer-events: none;
                }

                #darkbot-${id} .db-toggle {
                    display: flex; align-items: center; gap: 8px;
                    cursor: pointer; padding: 6px 0;
                }
                #darkbot-${id} .db-toggle-switch {
                    width: 36px; height: 20px; border-radius: 10px;
                    background: #333; position: relative; transition: background 0.2s;
                    flex-shrink: 0;
                }
                #darkbot-${id} .db-toggle-switch::after {
                    content: ''; position: absolute; top: 2px; left: 2px;
                    width: 16px; height: 16px; border-radius: 50%;
                    background: #888; transition: all 0.2s;
                }
                #darkbot-${id} .db-toggle.db-toggle-on .db-toggle-switch {
                    background: #e94560;
                }
                #darkbot-${id} .db-toggle.db-toggle-on .db-toggle-switch::after {
                    left: 18px; background: #fff;
                }
                #darkbot-${id} .db-toggle-label {
                    font-size: 11px; color: #ccc; font-weight: 600;
                }

                #darkbot-${id} .db-status {
                    font-size: 11px; color: #666; padding: 4px 0;
                }
                #darkbot-${id} .db-status.db-status-on { color: #4caf50; }
                #darkbot-${id} .db-status.db-status-off { color: #e94560; }

                #darkbot-${id} .db-console {
                    font-family: 'Consolas', monospace; font-size: 10px;
                    max-height: 200px; overflow-y: auto;
                }
                #darkbot-${id} .db-console-line {
                    padding: 2px 0; border-bottom: 1px solid #1a1a2e;
                    color: #888;
                }
                #darkbot-${id} .db-console-line .db-time { color: #555; }
            </style>

            <div class="db-header">
                <span class="db-header-title">DARKBOT</span>
                <button class="db-close">&times;</button>
            </div>
            <div class="db-tabs"></div>
            <div class="db-body"></div>
        `;

        document.body.appendChild(this.panel);
        this._setupDrag();
        this.panel.querySelector('.db-close').onclick = () => this.hide();
        return this;
    }

    addTab({ id, label, render }) {
        this.tabs.push({ id, label, render });
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
            this.panel.querySelector('.db-body').innerHTML = '';
            const content = document.createElement('div');
            content.innerHTML = tab.render();
            this.panel.querySelector('.db-body').appendChild(content);
            if (tab.afterRender) tab.afterRender();
        }
    }

    show() { this.panel.classList.add('darkbot-visible'); }
    hide() { this.panel.classList.remove('darkbot-visible'); }
    toggle() { this.panel.classList.toggle('darkbot-visible'); }
    isVisible() { return this.panel.classList.contains('darkbot-visible'); }

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

    /* Helpers para criar HTML de botoes/secoes */
    static section(title, content) {
        return `<div class="db-section"><div class="db-section-title">${title}</div>${content}</div>`;
    }

    static row(label, buttonsHtml) {
        return `<div class="db-row"><span class="db-label">${label}</span>${buttonsHtml}</div>`;
    }

    static btn(id, text, active = false) {
        return `<div class="db-btn ${active ? 'db-btn-active' : ''}" data-darkbot-btn="${id}">${text}</div>`;
    }

    static toggle(id, label, on = false) {
        return `<div class="db-toggle ${on ? 'db-toggle-on' : ''}" data-darkbot-toggle="${id}">
            <div class="db-toggle-switch"></div>
            <span class="db-toggle-label">${label}</span>
        </div>`;
    }

    static status(text, active = false) {
        return `<div class="db-status ${active ? 'db-status-on' : 'db-status-off'}">${text}</div>`;
    }
}
