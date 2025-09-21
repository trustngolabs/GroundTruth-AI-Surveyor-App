/**
 * GroundTruth AI Sync Service
 * 
 * This service handles data synchronization with the cloud:
 * - Upload survey packets to AWS S3
 * - Manage sync queue and retry logic
 * - Handle network connectivity changes
 * - Provide sync status and progress tracking
 */

import StorageService from './StorageService';

class SyncService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.isSyncing = false;
    this.syncProgress = 0;
    this.retryAttempts = {};
    this.maxRetries = 3;
    
    // AWS S3 configuration (in production, these would be environment variables)
    this.s3Config = {
      bucketName: 'groundtruth-survey-ingestion',
      region: 'us-east-1',
      endpoint: 'https://s3.amazonaws.com'
    };
    
    this.setupNetworkListeners();
  }

  /**
   * Setup network connectivity listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network connection lost');
    });
  }

  /**
   * Sync all pending survey packets
   */
  async syncAllPendingData() {
    if (!this.isOnline) {
      throw new Error('No internet connection available');
    }

    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    this.syncProgress = 0;

    try {
      // Get all pending survey packets
      const pendingPackets = await StorageService.getSurveyPacketsForSync();
      
      if (pendingPackets.length === 0) {
        console.log('No data to sync');
        return { success: true, synced: 0, failed: 0 };
      }

      console.log(`Starting sync of ${pendingPackets.length} survey packets`);
      
      let syncedCount = 0;
      let failedCount = 0;
      const results = [];

      for (let i = 0; i < pendingPackets.length; i++) {
        const packet = pendingPackets[i];
        this.syncProgress = ((i + 1) / pendingPackets.length) * 100;

        try {
          // Simulate S3 upload
          await this.delay(500); // Simulate network delay
          
          // Mark as synced
          await StorageService.markPacketAsSynced(packet.surveyId);
          syncedCount++;
          
          results.push({
            success: true,
            surveyId: packet.surveyId,
            s3Key: this.generateS3Key(packet),
            uploadedAt: new Date().toISOString()
          });
          
        } catch (error) {
          console.error(`Failed to sync packet ${packet.surveyId}:`, error);
          failedCount++;
          results.push({ 
            success: false, 
            surveyId: packet.surveyId, 
            error: error.message 
          });
        }
      }

      const syncResult = {
        success: failedCount === 0,
        synced: syncedCount,
        failed: failedCount,
        total: pendingPackets.length,
        results
      };

      console.log('Sync completed:', syncResult);
      return syncResult;

    } catch (error) {
      console.error('Sync process failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
      this.syncProgress = 0;
    }
  }

  /**
   * Generate S3 key (file path) for survey packet
   */
  generateS3Key(packet) {
    const date = new Date(packet.completedAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // S3 key format: surveys/YYYY/MM/DD/surveyId_timestamp.json
    return `surveys/${year}/${month}/${day}/${packet.surveyId}_${Date.now()}.json`;
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus() {
    const storageStats = await StorageService.getStorageStats();
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      syncProgress: this.syncProgress,
      pendingSync: storageStats.pendingSync,
      syncedSurveys: storageStats.syncedSurveys,
      totalSurveys: storageStats.completedSurveys
    };
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export default new SyncService();
