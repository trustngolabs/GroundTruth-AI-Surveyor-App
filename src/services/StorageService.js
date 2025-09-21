/**
 * GroundTruth AI Storage Service
 * 
 * This service handles all offline storage functionality:
 * - Local storage of survey data
 * - Survey packet management
 * - Data synchronization status tracking
 * - Offline-first data operations
 */

class StorageService {
  constructor() {
    this.dbName = 'GroundTruthSurveyorDB';
    this.dbVersion = 1;
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the storage service and IndexedDB
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize IndexedDB
      await this.initializeDB();
      
      this.isInitialized = true;
      console.log('Storage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw new Error('Storage initialization failed');
    }
  }

  /**
   * Initialize IndexedDB database
   */
  initializeDB() {
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.log("Your browser doesn't support IndexedDB. Using localStorage fallback.");
        this.useLocalStorageFallback = true;
        resolve();
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.log("IndexedDB error. Using localStorage fallback.");
        this.useLocalStorageFallback = true;
        resolve();
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create survey packets object store
        if (!db.objectStoreNames.contains('surveyPackets')) {
          const packetStore = db.createObjectStore('surveyPackets', { keyPath: 'surveyId' });
          packetStore.createIndex('status', 'status', { unique: false });
          packetStore.createIndex('completedAt', 'completedAt', { unique: false });
          packetStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }
      };
    });
  }

  /**
   * Save completed survey packet
   */
  async saveSurveyPacket(packet) {
    await this.ensureInitialized();
    
    try {
      const packetData = {
        ...packet,
        surveyId: packet.surveyId,
        status: packet.status || 'completed',
        syncStatus: 'pending',
        createdAt: new Date().toISOString()
      };

      if (this.useLocalStorageFallback) {
        localStorage.setItem(`survey_${packet.surveyId}`, JSON.stringify(packetData));
      } else {
        await this.putData('surveyPackets', packetData);
      }
      
      console.log('Survey packet saved:', packetData.surveyId);
      return packetData;
    } catch (error) {
      console.error('Failed to save survey packet:', error);
      throw new Error('Survey packet save failed');
    }
  }

  /**
   * Get survey packets ready for sync
   */
  async getSurveyPacketsForSync() {
    await this.ensureInitialized();
    
    try {
      if (this.useLocalStorageFallback) {
        const packets = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('survey_')) {
            const packet = JSON.parse(localStorage.getItem(key));
            if (packet.syncStatus === 'pending') {
              packets.push(packet);
            }
          }
        }
        return packets;
      } else {
        return await this.getDataByIndex('surveyPackets', 'syncStatus', 'pending');
      }
    } catch (error) {
      console.error('Failed to get sync packets:', error);
      return [];
    }
  }

  /**
   * Mark survey packet as synced
   */
  async markPacketAsSynced(surveyId) {
    await this.ensureInitialized();
    
    try {
      if (this.useLocalStorageFallback) {
        const key = `survey_${surveyId}`;
        const packetStr = localStorage.getItem(key);
        if (packetStr) {
          const packet = JSON.parse(packetStr);
          packet.syncStatus = 'synced';
          packet.syncedAt = new Date().toISOString();
          localStorage.setItem(key, JSON.stringify(packet));
        }
      } else {
        const packet = await this.getData('surveyPackets', surveyId);
        if (packet) {
          packet.syncStatus = 'synced';
          packet.syncedAt = new Date().toISOString();
          await this.putData('surveyPackets', packet);
        }
      }
      
      console.log('Packet marked as synced:', surveyId);
    } catch (error) {
      console.error('Failed to mark packet as synced:', error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats() {
    await this.ensureInitialized();
    
    try {
      let packets = [];
      
      if (this.useLocalStorageFallback) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('survey_')) {
            packets.push(JSON.parse(localStorage.getItem(key)));
          }
        }
      } else {
        packets = await this.getAllData('surveyPackets');
      }

      const stats = {
        totalSurveys: packets.length,
        completedSurveys: packets.length,
        pendingSync: packets.filter(p => p.syncStatus === 'pending').length,
        syncedSurveys: packets.filter(p => p.syncStatus === 'synced').length,
        lastUpdate: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return {
        totalSurveys: 0,
        completedSurveys: 0,
        pendingSync: 0,
        syncedSurveys: 0,
        lastUpdate: new Date().toISOString()
      };
    }
  }

  /**
   * Clear all local data (for logout/reset)
   */
  async clearAllData() {
    await this.ensureInitialized();
    
    try {
      if (this.useLocalStorageFallback) {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('survey_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } else {
        await this.clearStore('surveyPackets');
      }
      
      console.log('All local data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw new Error('Data clear failed');
    }
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Ensure storage is initialized
   */
  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  // IndexedDB helper methods
  async putData(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getData(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllData(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getDataByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async clearStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export default new StorageService();
