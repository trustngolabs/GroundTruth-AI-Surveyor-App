/**
 * GroundTruth AI Verification Service
 * 
 * This service handles all automated verification functionality:
 * - GPS tracking and location verification
 * - Timestamp logging for all survey activities
 * - Environment photo capture
 * - Data integrity checks
 * - Survey packet creation with verification metadata
 */

class VerificationService {
  constructor() {
    this.currentSurvey = null;
    this.verificationData = {
      surveyId: null,
      startTime: null,
      endTime: null,
      startLocation: null,
      endLocation: null,
      environmentPhoto: null,
      answerTimestamps: [],
      locationHistory: [],
      deviceInfo: null
    };
    this.locationWatcher = null;
    this.isTracking = false;
  }

  /**
   * Initialize verification for a new survey
   */
  async startSurvey(surveyId) {
    try {
      this.currentSurvey = surveyId;
      this.verificationData = {
        surveyId,
        startTime: new Date().toISOString(),
        endTime: null,
        startLocation: null,
        endLocation: null,
        environmentPhoto: null,
        answerTimestamps: [],
        locationHistory: [],
        deviceInfo: this.getDeviceInfo()
      };

      // Simulate getting initial GPS location
      const location = await this.simulateGetLocation();
      this.verificationData.startLocation = location;
      
      // Start simulated location tracking
      this.startLocationTracking();
      
      console.log('Verification started for survey:', surveyId);
      return this.verificationData;

    } catch (error) {
      console.error('Failed to start verification:', error);
      throw new Error('Verification initialization failed');
    }
  }

  /**
   * Log an answer with timestamp and location
   */
  async logAnswer(questionId, answer) {
    if (!this.currentSurvey) {
      console.warn('No active survey for answer logging');
      return;
    }

    try {
      const location = await this.simulateGetLocation();
      const timestamp = new Date().toISOString();

      const answerLog = {
        questionId,
        timestamp,
        location,
        answerType: this.getAnswerType(answer),
        answerLength: this.getAnswerLength(answer)
      };

      this.verificationData.answerTimestamps.push(answerLog);
      console.log('Answer logged:', answerLog);

    } catch (error) {
      console.error('Failed to log answer:', error);
      // Continue without location if GPS fails
      this.verificationData.answerTimestamps.push({
        questionId,
        timestamp: new Date().toISOString(),
        location: null,
        answerType: this.getAnswerType(answer),
        answerLength: this.getAnswerLength(answer)
      });
    }
  }

  /**
   * Complete survey verification and generate final packet
   */
  async completeSurvey() {
    if (!this.currentSurvey) {
      throw new Error('No active survey to complete');
    }

    try {
      // Stop location tracking
      this.stopLocationTracking();

      // Get final location
      const endLocation = await this.simulateGetLocation();
      this.verificationData.endLocation = endLocation;
      this.verificationData.endTime = new Date().toISOString();

      // Calculate survey duration
      const duration = new Date(this.verificationData.endTime) - new Date(this.verificationData.startTime);
      this.verificationData.duration = Math.round(duration / 1000); // in seconds

      // Generate verification hash
      this.verificationData.verificationHash = this.generateVerificationHash();

      // Create final verification packet
      const verificationPacket = {
        ...this.verificationData,
        completedAt: new Date().toISOString(),
        version: '1.0'
      };

      console.log('Survey verification completed:', verificationPacket);
      
      // Reset for next survey
      this.currentSurvey = null;
      
      return verificationPacket;

    } catch (error) {
      console.error('Failed to complete verification:', error);
      throw new Error('Verification completion failed');
    }
  }

  /**
   * Simulate getting GPS location (for demo purposes)
   */
  simulateGetLocation() {
    return new Promise((resolve) => {
      // Simulate a slight delay
      setTimeout(() => {
        // Return simulated location data
        const location = {
          latitude: 25.6123 + (Math.random() * 0.01),
          longitude: 85.1274 + (Math.random() * 0.01),
          accuracy: 10 + (Math.random() * 5),
          timestamp: new Date().toISOString()
        };
        resolve(location);
      }, 200);
    });
  }

  /**
   * Start simulated location tracking
   */
  startLocationTracking() {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;
    
    // Simulate periodic location updates
    this.locationWatcher = setInterval(async () => {
      const location = await this.simulateGetLocation();
      this.verificationData.locationHistory.push(location);
      
      // Keep only last 10 locations to prevent memory issues
      if (this.verificationData.locationHistory.length > 10) {
        this.verificationData.locationHistory = this.verificationData.locationHistory.slice(-10);
      }
    }, 10000); // Every 10 seconds
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking() {
    if (this.locationWatcher) {
      clearInterval(this.locationWatcher);
      this.locationWatcher = null;
      this.isTracking = false;
    }
  }

  /**
   * Get device information for verification
   */
  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Determine answer type for logging
   */
  getAnswerType(answer) {
    if (typeof answer === 'string') {
      return 'text';
    } else if (typeof answer === 'object' && answer !== null) {
      if (answer.type === 'audio') return 'audio';
      if (answer.type === 'photo') return 'photo';
      return 'object';
    }
    return 'unknown';
  }

  /**
   * Get answer length/size for logging
   */
  getAnswerLength(answer) {
    if (typeof answer === 'string') {
      return answer.length;
    } else if (typeof answer === 'object' && answer !== null && answer.blob) {
      return answer.blob.size;
    }
    return 0;
  }

  /**
   * Generate verification hash for data integrity
   */
  generateVerificationHash() {
    const dataString = JSON.stringify({
      surveyId: this.verificationData.surveyId,
      startTime: this.verificationData.startTime,
      endTime: this.verificationData.endTime,
      startLocation: this.verificationData.startLocation,
      endLocation: this.verificationData.endLocation,
      answerCount: this.verificationData.answerTimestamps.length,
      locationCount: this.verificationData.locationHistory.length
    });
    
    // Simple hash function (in production, use crypto.subtle.digest)
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Get current verification status
   */
  getVerificationStatus() {
    return {
      isActive: !!this.currentSurvey,
      surveyId: this.currentSurvey,
      startTime: this.verificationData.startTime,
      answerCount: this.verificationData.answerTimestamps.length,
      locationCount: this.verificationData.locationHistory.length,
      isTracking: this.isTracking
    };
  }
}

// Export singleton instance
export default new VerificationService();
