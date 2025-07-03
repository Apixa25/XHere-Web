import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './DownvoteDashboard.css';

const DownvoteDashboard = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [postingPermission, setPostingPermission] = useState(null);
  const [recentDownvotedLocations, setRecentDownvotedLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDownvoteData();
  }, [userId]);

  const loadDownvoteData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate userId
      if (!userId) {
        console.error('No userId provided to DownvoteDashboard');
        setError('User ID is required');
        return;
      }

      console.log('Loading downvote data for userId:', userId);

      // Load downvote statistics
      const statsResponse = await api.getDownvoteStats(userId);
      console.log('Downvote stats response:', statsResponse);
      
      // Check if response has the expected structure
      if (statsResponse && statsResponse.data && statsResponse.data.success && statsResponse.data.stats) {
        setStats(statsResponse.data.stats);
      } else if (statsResponse && statsResponse.success && statsResponse.stats) {
        // Handle direct response structure (not wrapped in data)
        setStats(statsResponse.stats);
      } else {
        console.error('Unexpected stats response structure:', statsResponse);
        setError('Invalid response format from server');
        return;
      }

      // Load posting permission
      const permissionResponse = await api.getPostingPermission();
      console.log('Posting permission response:', permissionResponse);
      
      if (permissionResponse && permissionResponse.data && permissionResponse.data.success && permissionResponse.data.permission) {
        setPostingPermission(permissionResponse.data.permission);
      } else if (permissionResponse && permissionResponse.success && permissionResponse.permission) {
        // Handle direct response structure (not wrapped in data)
        setPostingPermission(permissionResponse.permission);
      } else {
        console.error('Unexpected permission response structure:', permissionResponse);
        setError('Invalid permission response format');
        return;
      }

      // Load recent downvoted locations
      const locationsResponse = await api.getUserLocations(userId);
      console.log('User locations response:', locationsResponse);
      
      if (locationsResponse && locationsResponse.data) {
        const downvotedLocations = locationsResponse.data.filter(location => location.downvotes > 0);
        setRecentDownvotedLocations(downvotedLocations.slice(0, 5));
      }

    } catch (error) {
      console.error('Error loading downvote data:', error);
      setError(error.response?.data?.message || 'Failed to load downvote data');
    } finally {
      setLoading(false);
    }
  };

  const getPenaltyLevelColor = (level) => {
    const colors = {
      'none': '#4CAF50',
      'warning': '#FF9800',
      'restricted': '#F44336',
      'suspended': '#9C27B0',
      'banned': '#000000'
    };
    return colors[level] || '#666';
  };

  const getPenaltyLevelIcon = (level) => {
    const icons = {
      'none': '✅',
      'warning': '⚠️',
      'restricted': '🚫',
      'suspended': '⏸️',
      'banned': '🚨'
    };
    return icons[level] || '❓';
  };

  const formatTimeRemaining = (expiresAt) => {
    if (!expiresAt) return 'No expiration';
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="downvote-dashboard loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading downvote statistics...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="downvote-dashboard loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="downvote-dashboard error">
        <div className="error-icon">❌</div>
        <p>Error: {error}</p>
        <button onClick={loadDownvoteData} className="retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="downvote-dashboard">
        <p>No downvote data available</p>
      </div>
    );
  }

  return (
    <div className="downvote-dashboard">
      <div className="dashboard-header">
        <h3>🛡️ Downvote & Penalty Status</h3>
        <div className="penalty-indicator">
          <span 
            className="penalty-badge"
            style={{ backgroundColor: getPenaltyLevelColor(stats.currentPenaltyLevel) }}
          >
            {getPenaltyLevelIcon(stats.currentPenaltyLevel)} {stats.currentPenaltyLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Current Status */}
      <div className="status-section">
        <h4>📊 Current Statistics</h4>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalDownvotesReceived}</div>
            <div className="stat-label">Total Downvotes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.downvotedLocationsCount}</div>
            <div className="stat-label">Downvoted Locations</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalLocations}</div>
            <div className="stat-label">Total Locations</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{(stats.downvoteRatio * 100).toFixed(1)}%</div>
            <div className="stat-label">Downvote Ratio</div>
          </div>
        </div>
      </div>

      {/* Penalty Information */}
      <div className="penalty-section">
        <h4>🚨 Penalty Information</h4>
        <div className="penalty-details">
          <div className="penalty-item">
            <span className="penalty-label">Current Level:</span>
            <span className="penalty-value">
              {getPenaltyLevelIcon(stats.currentPenaltyLevel)} {stats.currentPenaltyLevel}
            </span>
          </div>
          
          {stats.penaltyExpiresAt && (
            <div className="penalty-item">
              <span className="penalty-label">Expires:</span>
              <span className="penalty-value">
                {formatTimeRemaining(stats.penaltyExpiresAt)}
              </span>
            </div>
          )}

          {stats.lastDownvoteDate && (
            <div className="penalty-item">
              <span className="penalty-label">Last Downvote:</span>
              <span className="penalty-value">
                {new Date(stats.lastDownvoteDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Posting Restrictions */}
      {postingPermission && (
        <div className="restrictions-section">
          <h4>📝 Posting Restrictions</h4>
          <div className="restrictions-grid">
            <div className="restriction-item">
              <span className="restriction-label">Can Post:</span>
              <span className={`restriction-value ${postingPermission.canPost ? 'allowed' : 'denied'}`}>
                {postingPermission.canPost ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="restriction-item">
              <span className="restriction-label">Max Per Day:</span>
              <span className="restriction-value">
                {postingPermission.restrictions.maxLocationsPerDay}
              </span>
            </div>
            <div className="restriction-item">
              <span className="restriction-label">Requires Approval:</span>
              <span className={`restriction-value ${postingPermission.restrictions.requiresApproval ? 'required' : 'not-required'}`}>
                {postingPermission.restrictions.requiresApproval ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="restriction-item">
              <span className="restriction-label">Credit Cost:</span>
              <span className="restriction-value">
                💰 {postingPermission.restrictions.creditCost}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Next Threshold */}
      {stats.nextPenaltyThreshold && (
        <div className="threshold-section">
          <h4>🎯 Next Penalty Threshold</h4>
          <div className="threshold-info">
            <div className="threshold-item">
              <span className="threshold-label">Level:</span>
              <span className="threshold-value">{stats.nextPenaltyThreshold.level}</span>
            </div>
            <div className="threshold-item">
              <span className="threshold-label">Downvotes Needed:</span>
              <span className="threshold-value">{stats.nextPenaltyThreshold.downvotesNeeded}</span>
            </div>
            <div className="threshold-item">
              <span className="threshold-label">Locations Needed:</span>
              <span className="threshold-value">{stats.nextPenaltyThreshold.locationsNeeded}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Downvoted Locations */}
      {stats.downvotedLocations && stats.downvotedLocations.length > 0 && (
        <div className="locations-section">
          <h4>📍 Recent Downvoted Locations</h4>
          <div className="locations-list">
            {stats.downvotedLocations.slice(0, 5).map((location, index) => (
              <div key={location.id} className="location-item">
                <div className="location-header">
                  <span className="location-type">{location.locationType}</span>
                  <span className="location-date">
                    {new Date(location.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="location-stats">
                  <span className="vote-stat upvotes">👍 {location.upvotes}</span>
                  <span className="vote-stat downvotes">👎 {location.downvotes}</span>
                  <span className="location-status">{location.locationStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips for Improvement */}
      <div className="tips-section">
        <h4>💡 Tips to Improve</h4>
        <ul className="tips-list">
          <li>✅ Post accurate, helpful locations</li>
          <li>✅ Include clear descriptions and photos</li>
          <li>✅ Verify information before posting</li>
          <li>✅ Avoid posting duplicate or misleading content</li>
          <li>✅ Engage positively with the community</li>
        </ul>
      </div>
    </div>
  );
};

export default DownvoteDashboard; 