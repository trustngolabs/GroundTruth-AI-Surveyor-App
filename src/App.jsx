import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen'
import DashboardScreen from './components/DashboardScreen'
import SurveyScreen from './components/SurveyScreen'
import StorageService from './services/StorageService'
import VerificationService from './services/VerificationService'
import SyncService from './services/SyncService'
import './App.css'

function App() {
  const [currentScreen, setCurrentScreen] = useState('login')
  const [user, setUser] = useState(null)
  const [currentSurvey, setCurrentSurvey] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Initialize services
    const initializeApp = async () => {
      try {
        await StorageService.initialize()
        console.log('App initialized successfully')
        setIsInitialized(true)
      } catch (error) {
        console.error('App initialization failed:', error)
        // Continue with limited functionality
        setIsInitialized(true)
      }
    }

    initializeApp()

    // Setup network listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setCurrentScreen('dashboard')
  }

  const handleLogout = () => {
    setUser(null)
    setCurrentSurvey(null)
    setCurrentScreen('login')
    
    // Clear any ongoing verification
    if (VerificationService.getVerificationStatus().isActive) {
      VerificationService.completeSurvey().catch(console.error)
    }
  }

  const handleStartSurvey = (survey) => {
    setCurrentSurvey(survey)
    setCurrentScreen('survey')
  }

  const handleCompleteSurvey = async (surveyPacket) => {
    try {
      // Save survey packet locally
      await StorageService.saveSurveyPacket(surveyPacket)
      
      // Return to dashboard
      setCurrentSurvey(null)
      setCurrentScreen('dashboard')
      
      console.log('Survey completed and saved:', surveyPacket.surveyId)
    } catch (error) {
      console.error('Failed to save completed survey:', error)
      alert('Failed to save survey. Please try again.')
    }
  }

  const handleBackToDashboard = () => {
    // If there's an active survey, ask for confirmation
    if (currentSurvey && VerificationService.getVerificationStatus().isActive) {
      const confirmExit = window.confirm(
        'Are you sure you want to exit this survey? Your progress will be lost.'
      )
      
      if (!confirmExit) {
        return
      }
      
      // Stop verification if active
      VerificationService.completeSurvey().catch(console.error)
    }
    
    setCurrentSurvey(null)
    setCurrentScreen('dashboard')
  }

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Initializing GroundTruth Surveyor
          </h2>
          <p className="text-gray-600">
            Setting up offline storage and verification systems...
          </p>
        </div>
      </div>
    )
  }

  // Render appropriate screen based on current state
  switch (currentScreen) {
    case 'login':
      return (
        <LoginScreen 
          onLogin={handleLogin} 
          isOnline={isOnline}
        />
      )
    
    case 'dashboard':
      return (
        <DashboardScreen 
          user={user}
          onLogout={handleLogout}
          onStartSurvey={handleStartSurvey}
          isOnline={isOnline}
        />
      )
    
    case 'survey':
      return (
        <SurveyScreen 
          survey={currentSurvey}
          onComplete={handleCompleteSurvey}
          onBack={handleBackToDashboard}
          verificationService={VerificationService}
        />
      )
    
    default:
      return (
        <div className="app-container flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Unknown Screen
            </h2>
            <p className="text-gray-600 mb-4">
              Something went wrong. Please restart the app.
            </p>
            <button 
              onClick={() => setCurrentScreen('login')}
              className="btn btn-primary"
            >
              Go to Login
            </button>
          </div>
        </div>
      )
  }
}

export default App
