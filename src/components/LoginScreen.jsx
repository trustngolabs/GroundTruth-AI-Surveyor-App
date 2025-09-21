import { useState } from 'react';

export default function LoginScreen({ onLogin, isOnline }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    // Simulate authentication (in real app, this would call your auth service)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      // For demo purposes, accept any email/password combination
      // In a real app, this would validate against a backend
      if (email.includes('@') && password.length >= 6) {
        onLogin({ email, name: email.split('@')[0] });
      } else {
        setError('Invalid email or password (password must be at least 6 characters)');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header with online status */}
      <div className="app-header">
        <div></div>
        <div className="online-status">
          <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`}></span>
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>

      <div style={{ padding: '2rem 1.5rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img 
            src="/logo.png" 
            alt="GroundTruth Logo" 
            className="app-logo"
            style={{ height: '60px', margin: '0 auto' }}
          />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '1rem', marginBottom: '0.5rem' }}>
            GroundTruth Surveyor
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Sign in to access your daily surveys
          </p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="surveyor@groundtruth.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ 
              backgroundColor: '#fef2f2', 
              color: '#b91c1c',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading || !isOnline}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>

          {!isOnline && (
            <div style={{ 
              backgroundColor: '#fffbeb', 
              color: '#92400e',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              marginTop: '1rem',
              fontSize: '0.875rem'
            }}>
              <strong>Offline Mode:</strong> Please connect to the internet to sign in and sync your surveys.
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#6b7280', fontSize: '0.75rem' }}>
          GroundTruth AI Surveyor App v1.0
        </div>
      </div>
    </div>
  );
}
