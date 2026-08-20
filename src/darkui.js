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
        this.styleEl.id = '_s';
        this.styleEl.textContent = `
            #_p {
                position: fixed; top: 80px; left: 80px;
                width: ${width}px; height: ${height}px;
                background: #2a1a0e; border: 2px solid #8b6914;
                border-radius: 8px; z-index: 99999;
                font-family: Arial, sans-serif; font-size: 13px;
                color: #fc6; box-shadow: 0 8px 32px rgba(0,0,0,0.7);
                display: none; flex-direction: column; overflow: hidden;
            }
            #_p.x-v { display: flex; }

            #_p .x-h {
                background: #1a0f06; padding: 10px 14px;
                display: flex; align-items: center; justify-content: space-between;
                cursor: move; user-select: none;
                border-bottom: 2px solid #8b6914; flex-shrink: 0;
            }
            #_p .x-ht {
                font-size: 15px; font-weight: 700; color: #d4a017;
                letter-spacing: 1px;
            }
            #_p .x-x {
                background: none; border: none; color: #8b6914;
                font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1;
            }
            #_p .x-x:hover { color: #e74c3c; }

            #_p .x-ts {
                display: flex; background: #1a0f06;
                border-bottom: 1px solid rgba(139,105,20,0.4); flex-shrink: 0;
            }
            #_p .x-t {
                padding: 8px 16px; cursor: pointer;
                color: #888; font-size: 11px; font-weight: 700;
                text-transform: uppercase; letter-spacing: 0.5px;
                border-bottom: 2px solid transparent; transition: all 0.15s;
            }
            #_p .x-t:hover { color: #d4a017; }
            #_p .x-t.x-ta {
                color: #fc6; border-bottom-color: #d4a017;
                background: rgba(139,105,20,0.1);
            }

            #_p .x-bd {
                flex: 1; overflow-y: auto; padding: 12px;
            }
            #_p .x-bd::-webkit-scrollbar { width: 6px; }
            #_p .x-bd::-webkit-scrollbar-track { background: #1a0f06; }
            #_p .x-bd::-webkit-scrollbar-thumb { background: #8b6914; border-radius: 3px; }

            #_p .x-s {
                background: rgba(139,105,20,0.08); border-radius: 6px;
                padding: 12px; margin-bottom: 10px;
                border: 1px solid rgba(139,105,20,0.3);
            }
            #_p .x-st {
                font-size: 13px; font-weight: 700; color: #d4a017;
                margin-bottom: 8px; padding-bottom: 4px;
                border-bottom: 1px solid rgba(139,105,20,0.4);
            }
            #_p .x-r {
                display: flex; gap: 6px; margin-bottom: 6px;
                align-items: center; flex-wrap: wrap;
            }
            #_p .x-l {
                font-size: 12px; color: #aaa; min-width: 90px; font-weight: 600;
            }

            #_p .x-b {
                padding: 4px 10px; border-radius: 3px;
                border: 1px solid #8b6914; background: #1a1a1a;
                color: #fc6; cursor: pointer; font-size: 11px;
                font-weight: 700; transition: all 0.15s; white-space: nowrap;
            }
            #_p .x-b:hover {
                background: #3a2a10; border-color: #d4a017;
            }
            #_p .x-b.x-ba {
                background: #4CAF50; border-color: #4CAF50; color: #fff;
            }
            #_p .x-b.x-bd2 {
                border-color: #c0392b;
            }
            #_p .x-b.x-bd2:hover {
                background: #c0392b; color: #fff;
            }

            #_p .x-cb {
                display: flex; align-items: center; gap: 8px;
                cursor: pointer; padding: 4px 6px; border-radius: 4px;
                transition: background 0.15s;
            }
            #_p .x-cb:hover {
                background: rgba(255,255,255,0.08);
            }
            #_p .x-cbb {
                width: 16px; height: 16px; border: 2px solid #8b6914;
                border-radius: 3px; display: flex; align-items: center;
                justify-content: center; flex-shrink: 0; transition: all 0.15s;
            }
            #_p .x-cb.x-on .x-cbb {
                background: #4CAF50; border-color: #4CAF50;
            }
            #_p .x-cbc {
                color: #fff; font-size: 11px; font-weight: 700;
                line-height: 1; display: none;
            }
            #_p .x-cb.x-on .x-cbc {
                display: block;
            }
            #_p .x-cbl {
                font-size: 12px; color: #fc6;
            }

            #_p .x-st2 {
                font-size: 11px; color: #aaa; padding: 4px 0;
            }
            #_p .x-st2.x-son { color: #4CAF50; }
            #_p .x-st2.x-soff { color: #e74c3c; }

            #_p .x-co {
                font-family: Consolas, monospace; font-size: 10px;
                max-height: 200px; overflow-y: auto;
            }
            #_p .x-cl {
                padding: 2px 0; border-bottom: 1px solid rgba(139,105,20,0.15);
                color: #aaa;
            }
            #_p .x-cl .x-tm { color: #666; }

            #_p .x-f {
                padding: 8px 12px; border-top: 1px solid rgba(139,105,20,0.4);
                display: flex; justify-content: center; gap: 10px; flex-shrink: 0;
            }
            #_p .x-fb {
                cursor: pointer; padding: 6px 16px; border-radius: 4px;
                font-size: 12px; font-weight: 700; color: #fff;
                transition: all 0.15s;
            }
            #_p .x-fb.x-xb {
                background: #8b6914;
            }
            #_p .x-fb.x-xb:hover {
                background: #a67c1a;
            }

            ._tb {
                position: fixed; bottom: 20px; right: 20px; z-index: 99998;
                width: 36px; height: 36px; border-radius: 50%;
                background: #1a0f06; border: 2px solid #8b6914;
                color: #d4a017; font-size: 18px; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                transition: all 0.15s;
            }
            ._tb:hover {
                background: #2a1a0e; border-color: #d4a017;
                transform: scale(1.1);
            }
        `;
        document.head.appendChild(this.styleEl);

        this.panel = document.createElement('div');
        this.panel.id = '_p';
        this.panel.innerHTML = `
            <div class="x-h">
                <span class="x-ht">${title}</span>
                <button class="x-x">&times;</button>
            </div>
            <div class="x-ts"></div>
            <div class="x-bd"></div>
            <div class="x-f">
                <div class="x-fb x-xb">Fechar</div>
            </div>
        `;

        document.body.appendChild(this.panel);
        this._setupDrag();
        this.panel.querySelector('.x-x').onclick = () => this.hide();
        this.panel.querySelector('.x-xb').onclick = () => this.hide();
        return this;
    }

    addTab({ id, label, render, afterRender }) {
        this.tabs.push({ id, label, render, afterRender });
        const tabsEl = this.panel.querySelector('.x-ts');
        const tab = document.createElement('div');
        tab.className = 'x-t';
        tab.dataset.tab = id;
        tab.textContent = label;
        tab.onclick = () => this._selectTab(id);
        tabsEl.appendChild(tab);
        if (!this.activeTab) this._selectTab(id);
    }

    _selectTab(id) {
        this.activeTab = id;
        this.panel.querySelectorAll('.x-t').forEach(t => {
            t.classList.toggle('x-ta', t.dataset.tab === id);
        });
        const tab = this.tabs.find(t => t.id === id);
        if (tab) {
            const body = this.panel.querySelector('.x-bd');
            body.innerHTML = '';
            const content = document.createElement('div');
            content.innerHTML = tab.render();
            body.appendChild(content);
            if (tab.afterRender) tab.afterRender();
        }
    }

    show() { this.panel.classList.add('x-v'); }
    hide() { this.panel.classList.remove('x-v'); }
    toggle() { this.panel.classList.toggle('x-v'); }
    isVisible() { return this.panel.classList.contains('x-v'); }
    refresh() { if (this.activeTab) this._selectTab(this.activeTab); }

    _setupDrag() {
        const header = this.panel.querySelector('.x-h');
        header.onmousedown = (e) => {
            if (e.target.classList.contains('x-x')) return;
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

    static section(title, content) {
        return `<div class="x-s"><div class="x-st">${title}</div>${content}</div>`;
    }

    static row(label, buttonsHtml) {
        return `<div class="x-r"><span class="x-l">${label}</span>${buttonsHtml}</div>`;
    }

    static btn(id, text, active = false) {
        return `<div class="x-b ${active ? 'x-ba' : ''}" data-d="${id}">${text}</div>`;
    }

    static btnDanger(id, text) {
        return `<div class="x-b x-bd2" data-d="${id}">${text}</div>`;
    }

    static checkbox(id, label, on = false) {
        return `<div class="x-cb ${on ? 'x-on' : ''}" data-c="${id}">
            <div class="x-cbb"><span class="x-cbc">\u2713</span></div>
            <span class="x-cbl">${label}</span>
        </div>`;
    }

    static status(text, active = false) {
        return `<div class="x-st2 ${active ? 'x-son' : 'x-soff'}">${text}</div>`;
    }

    cleanup = () => {
        if (this.styleEl) this.styleEl.remove();
        if (this.panel) this.panel.remove();
    };
}
