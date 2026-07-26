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
