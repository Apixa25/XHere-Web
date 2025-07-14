import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/AppMobile.css';

const MobileApp = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('map');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Determine active tab based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === '/' || path === '/map') setActiveTab('map');
    else if (path === '/profile') setActiveTab('profile');
    else if (path === '/admin') setActiveTab('admin');
    else if (path === '/settings') setActiveTab('settings');
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'map':
        navigate('/');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        break;
    }
  };

  return (
    <div className="mobile-app-container">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="mobile-offline-indicator">
          📡 You're offline - some features may be limited
        </div>
      )}

      {/* Main content area */}
      <div className="mobile-content-area">
        {children}
      </div>

      {/* Bottom navigation */}
      <div className="mobile-bottom-nav">
        <button
          className={`nav-button ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => handleTabChange('map')}
        >
          <span className="nav-icon">🗺️</span>
          <span className="nav-label">Map</span>
        </button>

        <button
          className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => handleTabChange('profile')}
        >
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </button>

        <button
          className={`nav-button ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => handleTabChange('admin')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Admin</span>
        </button>

        <button
          className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => handleTabChange('settings')}
        >
          <span className="nav-icon">🔧</span>
          <span className="nav-label">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default MobileApp; 