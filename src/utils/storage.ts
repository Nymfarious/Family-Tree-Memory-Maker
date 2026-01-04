export const StorageUtils = {
  saveLocal(key: string, data: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  loadLocal<T>(key: string, fallback: T | null = null): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  },

  clearLocal(key: string): void {
    localStorage.removeItem(key);
  }
};