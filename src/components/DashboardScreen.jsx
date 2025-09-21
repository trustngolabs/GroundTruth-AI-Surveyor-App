import { useState, useEffect } from 'react';

export default function DashboardScreen({ user, onLogout, onStartSurvey, isOnline }) {
  const [surveys, setSurveys] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Mock survey data - in real app, this would come from API/local storage
  const mockSurveys = [
    {
      id: 1,
      title: "Kisan Kendra - Farmer Needs Assessment",
      location: "Village Rampur, Block Sadar",
      address: "Near Primary School, Rampur Village",
      type: "Agricultural Survey",
      status: "pending",
      estimatedTime: "45 min",
      questions: 25,
      priority: "high"
    },
    {
      id: 2,
      title: "SwasthyaLink - Healthcare Access Survey",
      location: "PHC Madhubani",
      address: "Primary Health Center, Madhubani",
      type: "Healthcare Survey", 
      status: "pending",
      estimatedTime: "30 min",
      questions: 18,
      priority: "medium"
    },
    {
      id: 3,
      title: "YojanaAI - Government Scheme Awareness",
      location: "Community Center, Darbhanga",
      address: "Main Road, Community Center",
      type: "Government Survey",
      status: "completed",
      estimatedTime: "35 min",
      questions: 22,
      priority: "low"
    },
    {
      id: 4,
      title: "GetSaarthi - SME Business Assessment",
      location: "Market Area, Sitamarhi",
      address: "Central Market, Shop No. 45-50",
      type: "Business Survey",
      status: "synced",
      estimatedTime: "40 min",
      questions: 20,
      priority: "medium"
    }
  ];

  useEffect(() => {
    // Load surveys on component mount
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSurveys(mockSurveys);
    } catch (error) {
      console.error('Failed to load surveys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update completed surveys to synced status
      setSurveys(prev => prev.map(survey => 
        survey.status === 'completed' 
          ? { ...survey, status: 'synced' }
          : survey
      ));
      
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { className: 'badge-pending', label: 'Pending' },
      completed: { className: 'badge-completed', label: 'Completed' },
      synced: { className: 'badge-synced', label: 'Synced' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`badge ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBorder = (priority) => {
    const colors = {
      high: 'border-red-500',
      medium: 'border-yellow-500', 
      low: 'border-green-500'
    };
    return colors[priority] || colors.medium;
  };

  const completedSurveys = surveys.filter(s => s.status === 'completed');

  return (
    <div className="app-container">
      {/* Header */}
      <div className="app-header">
        <div>
          <h1 style={{ fontWeight: '600', margin: 0 }}>Welcome, {user?.name}</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>Daily Briefing</p>
        </div>
        
        <div className="online-status">
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div style={{ padding: '1rem' }}>
        {/* Sync Section */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: '500', margin: 0 }}>Data Sync</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                {completedSurveys.length > 0 
                  ? `${completedSurveys.length} survey(s) ready to sync`
                  : lastSyncTime 
                    ? `Last synced: ${lastSyncTime.toLocaleTimeString()}`
                    : 'No data to sync'
                }
              </p>
            </div>
            
            <button
              className={`btn ${isOnline && completedSurveys.length > 0 ? 'btn-success' : 'btn-secondary'}`}
              onClick={handleSyncData}
              disabled={!isOnline || isSyncing || completedSurveys.length === 0}
            >
              {isSyncing ? 'Syncing...' : 'Sync Data Now'}
            </button>
          </div>
        </div>

        {/* Survey Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', margin: '1rem 0' }}>
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {surveys.filter(s => s.status === 'pending').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Pending</div>
          </div>
          
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {surveys.filter(s => s.status === 'completed').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Completed</div>
          </div>
          
          <div className="card" style={{ padding: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0056b3' }}>
              {surveys.filter(s => s.status === 'synced').length}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Synced</div>
          </div>
        </div>

        {/* Assigned Surveys */}
        <div className="card">
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', margin: '0 0 1rem 0' }}>
            Today's Assigned Surveys
          </h2>
          
          {isLoading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
              Loading surveys...
            </div>
          ) : surveys.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
              No surveys assigned for today
            </div>
          ) : (
            <div>
              {surveys.map((survey, index) => (
                <div 
                  key={survey.id} 
                  className="survey-item"
                  style={{ 
                    borderLeft: `4px solid ${survey.priority === 'high' ? '#ef4444' : survey.priority === 'medium' ? '#f59e0b' : '#10b981'}`,
                    paddingLeft: '0.75rem'
                  }}
                >
                  <div className="survey-info">
                    <h3>{survey.title}</h3>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span className="location-badge">
                        <i className="fas fa-map-marker-alt"></i>
                        {survey.location}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        • {survey.estimatedTime}
                      </span>
                    </p>
                  </div>
                  
                  <div className="survey-actions">
                    {getStatusBadge(survey.status)}
                    
                    {survey.status === 'pending' && (
                      <button
                        className="btn btn-primary"
                        style={{ marginLeft: '0.5rem' }}
                        onClick={() => onStartSurvey(survey)}
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button 
            className="btn btn-secondary"
            onClick={onLogout}
          >
            Sign Out
          </button>
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <div style={{ 
            backgroundColor: '#fffbeb', 
            color: '#92400e',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            marginTop: '1rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <i className="fas fa-wifi-slash"></i>
            <div>
              <strong>Offline Mode</strong>
              <p style={{ margin: '0.25rem 0 0 0' }}>
                You can continue working on surveys. Data will be saved locally and synced when you're back online.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
