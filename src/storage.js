class DarkStorage {
    getStorage = () => {
        if (typeof uw === 'undefined') return {};
        const worldId = uw.Game.world_id;
        const savedValue = localStorage.getItem(`${worldId}_darkBot`);
        let storage = {};
        if (savedValue !== null && savedValue !== undefined) {
            try { storage = JSON.parse(savedValue); } catch (e) { console.error(`DarkBot storage parse error: ${e}`); }
        }
        return storage;
    };

    saveStorage = storage => {
        try {
            if (typeof uw === 'undefined') return false;
            const worldId = uw.Game.world_id;
            localStorage.setItem(`${worldId}_darkBot`, JSON.stringify(storage));
            return true;
        } catch (e) { console.error(`DarkBot storage save error: ${e}`); return false; }
    };

    save = (key, content) => {
        const storage = this.getStorage();
        storage[key] = content;
        return this.saveStorage(storage);
    };

    load = (key, defaultValue = null) => {
        const storage = this.getStorage();
        const savedValue = storage[key];
        return savedValue !== undefined ? savedValue : defaultValue;
    };
}
