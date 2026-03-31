//when the app starts, try to load saved cluster data
//if none exists, use the default data
//if saved data is broken, reset to the default data
//when clusters change, save them back to the browser

const STORAGE_KEY = "careecho_clusters";

export function loadClusters(seedClusters) {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        loacalStorage.setItem(STORAGE_KEY, JSON.stringify(seedClusters));
        return seedClusters;
    }

    try {
        return JSON.parse(raw);
    } catch {
        localStorage.setItem(STORAGE_KEY, seedClusters);
        return seedClusters;
    }
}

export function saveClusters(clusters) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clusters));
}