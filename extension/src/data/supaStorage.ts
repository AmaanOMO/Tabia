export const chromeStorageAdapter = {
  async getItem(key: string) {
    const r = await chrome.storage.local.get(key);
    return r[key] ?? null;
  },
  async setItem(key: string, value: string) {
    await chrome.storage.local.set({ [key]: value });
  },
  async removeItem(key: string) {
    await chrome.storage.local.remove(key);
  },
};

