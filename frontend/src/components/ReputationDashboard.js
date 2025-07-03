import React, { useState, useEffect } from 'react';
import './ReputationDashboard.css';

const ReputationDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReputationDashboard();
  }, []);

  const loadReputationDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/reputation/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load reputation dashboard');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading reputation dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevelColor = (trustLevel) => {
    switch (trustLevel) {
      case 'new': return '#6c757d';
      case 'trusted': return '#28a745';
      case 'verified': return '#007bff';
      case 'moderator': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getTrustLevelIcon = (trustLevel) => {
    switch (trustLevel) {
      case 'new': return '🌱';
      case 'trusted': return '✅';
      case 'verified': return '⭐';
      case 'moderator': return '👑';
      default: return '🌱';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="reputation-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your reputation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reputation-dashboard">
        <div className="error-message">
          <h3>❌ Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={loadReputationDashboard} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="reputation-dashboard">
        <div className="error-message">
          <h3>No data available</h3>
          <p>Unable to load reputation information.</p>
        </div>
      </div>
    );
  }

  const { user, restrictions, recentLocations, progressToNext, nextTrustLevel, reputationHistory } = dashboardData;

  return (
    <div className="reputation-dashboard">
      <div className="dashboard-header">
        <h2>🏆 Reputation Dashboard</h2>
        <p>Track your progress and unlock new privileges</p>
      </div>

      {/* Trust Level Card */}
      <div className="trust-level-card">
        <div className="trust-level-header">
          <span className="trust-level-icon" style={{ color: getTrustLevelColor(user.trustLevel) }}>
            {getTrustLevelIcon(user.trustLevel)}
          </span>
          <div className="trust-level-info">
            <h3 className="trust-level-name">{user.trustLevel.charAt(0).toUpperCase() + user.trustLevel.slice(1)}</h3>
            <p className="trust-level-description">
              {user.trustLevel === 'new' && 'New community member - start building your reputation!'}
              {user.trustLevel === 'trusted' && 'Trusted contributor - your posts are valued by the community!'}
              {user.trustLevel === 'verified' && 'Verified expert - you\'re a recognized quality contributor!'}
              {user.trustLevel === 'moderator' && 'Community moderator - you help maintain quality standards!'}
            </p>
          </div>
        </div>

        {/* Progress to next level */}
        {nextTrustLevel && (
          <div className="progress-section">
            <div className="progress-info">
              <span>Progress to {nextTrustLevel}:</span>
              <span>{Math.round(progressToNext)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progressToNext}%` }}
              ></div>
            </div>
            <p className="progress-text">
              {user.reputationScore} / {nextTrustLevel.minScore} points needed
            </p>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h4>Reputation Score</h4>
            <p className="stat-value">{user.reputationScore}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <h4>Total Locations</h4>
            <p className="stat-value">{user.totalLocationsCount}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h4>Quality Locations</h4>
            <p className="stat-value">{user.qualityLocationsCount}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h4>Average Rating</h4>
            <p className="stat-value">{user.averageLocationRating.toFixed(1)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <h4>Credits</h4>
            <p className="stat-value">{user.credits}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h4>Daily Limit</h4>
            <p className="stat-value">{restrictions.maxLocationsPerDay}</p>
          </div>
        </div>
      </div>

      {/* Posting Restrictions */}
      <div className="restrictions-card">
        <h3>📋 Posting Privileges</h3>
        <div className="restrictions-grid">
          <div className="restriction-item">
            <span className="restriction-label">Daily Posting Limit:</span>
            <span className="restriction-value">{restrictions.maxLocationsPerDay} locations</span>
          </div>
          <div className="restriction-item">
            <span className="restriction-label">Requires Approval:</span>
            <span className="restriction-value">
              {restrictions.requiresApproval ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="restriction-item">
            <span className="restriction-label">Credit Cost (Paid Locations):</span>
            <span className="restriction-value">{restrictions.creditCost} credits</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentLocations.length > 0 && (
        <div className="recent-activity-card">
          <h3>📝 Recent Activity</h3>
          <div className="activity-list">
            {recentLocations.slice(0, 5).map((location) => (
              <div key={location.id} className="activity-item">
                <div className="activity-content">
                  <p className="activity-text">
                    {location.content?.text?.substring(0, 50)}...
                  </p>
                  <div className="activity-meta">
                    <span className="activity-date">{formatDate(location.createdAt)}</span>
                    <span className="activity-status">{location.locationStatus}</span>
                    <span className="activity-votes">
                      👍 {location.upvotes} 👎 {location.downvotes}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reputation History Chart */}
      {reputationHistory.length > 0 && (
        <div className="history-card">
          <h3>📈 Reputation History</h3>
          <div className="history-chart">
            {reputationHistory.slice(-10).map((entry, index) => (
              <div key={index} className="history-point">
                <div 
                  className="history-bar" 
                  style={{ 
                    height: `${(entry.score / Math.max(...reputationHistory.map(h => h.score))) * 100}%` 
                  }}
                ></div>
                <span className="history-score">{entry.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="dashboard-actions">
        <button onClick={loadReputationDashboard} className="refresh-button">
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default ReputationDashboard; 