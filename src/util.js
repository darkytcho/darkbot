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
