class DarkStorage {
    getWorldId = () => {
        try {
            if (typeof uw !== 'undefined' && uw.Game && uw.Game.world_id) return uw.Game.world_id;
        } catch (e) {}
        try {
            var m = window.location.pathname.match(/\/(\d+)_\w+\//);
            if (m) return m[1];
        } catch (e) {}
        return 'default';
    };

    getStorage = () => {
        var worldId = this.getWorldId();
        var savedValue = localStorage.getItem(worldId + '_darkBot');
        var storage = {};
        if (savedValue !== null && savedValue !== undefined) {
            try { storage = JSON.parse(savedValue); } catch (e) {}
        }
        return storage;
    };

    saveStorage = storage => {
        try {
            var worldId = this.getWorldId();
            localStorage.setItem(worldId + '_darkBot', JSON.stringify(storage));
            return true;
        } catch (e) { return false; }
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
