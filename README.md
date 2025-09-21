# GroundTruth AI Surveyor App - Clean Source Code

This is the clean source code for the GroundTruth AI Surveyor App, a mobile-first web application for conducting field surveys with offline capabilities, automated verification, and data synchronization features.

## Features

- **Mobile-First Design**: Optimized for field use on mobile devices
- **Offline-First Architecture**: Works without internet connection using IndexedDB
- **Multiple Question Types**: Support for multiple choice, text input, audio recording, and photo capture
- **Automated Verification**: Background verification service for data quality
- **Data Synchronization**: Secure sync with AWS S3 when online
- **Professional Interface**: Clean, intuitive UI for surveyors

## Project Structure

```
src/
├── App.jsx                    # Main application component with routing
├── App.css                    # Global application styles
├── index.js                   # React application entry point
├── index.css                  # Base CSS styles
├── components/
│   ├── LoginScreen.jsx        # Authentication interface
│   ├── DashboardScreen.jsx    # Main dashboard with survey list
│   └── SurveyScreen.jsx       # Survey flow with question types
└── services/
    ├── StorageService.js      # IndexedDB offline storage
    ├── SyncService.js         # Data synchronization with cloud
    └── VerificationService.js # Background verification system
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Dependencies

- React 18.2.0
- React Router DOM 6.14.1
- LocalForage 1.10.0 (IndexedDB wrapper)
- UUID 9.0.0 (Unique ID generation)

## Technical Features

- **Offline Storage**: Uses IndexedDB for local data persistence
- **Progressive Web App**: Configured as PWA with manifest.json
- **Responsive Design**: Mobile-first with desktop compatibility
- **State Management**: React hooks for application state
- **Service Architecture**: Modular services for storage, sync, and verification

## Usage

1. **Login**: Enter credentials to access the surveyor dashboard
2. **Dashboard**: View assigned surveys and sync status
3. **Survey**: Complete surveys with various question types
4. **Offline Mode**: Continue working without internet connection
5. **Sync**: Automatically sync data when connection is restored

## Version

This is the published version (commit: 932360de) of the GroundTruth AI Surveyor App.
