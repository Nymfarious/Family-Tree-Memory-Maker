// src/utils/storage.js (localStorage utilities)
window.StorageUtils = {
  saveLocal(key, data) {
    try { 
      localStorage.setItem(key, JSON.stringify(data)); 
      return true; 
    }
    catch { 
      return false; 
    }
  },
  loadLocal(key, fallback = null) {
    try { 
      return JSON.parse(localStorage.getItem(key)) ?? fallback; 
    }
    catch { 
      return fallback; 
    }
  },
  clearLocal(key) { 
    localStorage.removeItem(key); 
  }
};