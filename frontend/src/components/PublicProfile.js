import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './PublicProfile.css';

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      loadPublicProfile();
    }
  }, [userId]);

  const loadPublicProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/leaderboard/profile/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to load public profile');
      }

      const data = await response.json();
      setProfile(data.data);
    } catch (err) {
      console.error('Error loading public profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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

  const getTrustLevelColor = (trustLevel) => {
    switch (trustLevel) {
      case 'new': return '#6c757d';
      case 'trusted': return '#28a745';
      case 'verified': return '#007bff';
      case 'moderator': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="public-profile">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-profile">
        <div className="error-message">
          <h3>❌ Error Loading Profile</h3>
          <p>{error}</p>
          <button onClick={loadPublicProfile} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="public-profile">
        <div className="error-message">
          <h3>Profile Not Found</h3>
          <p>The requested profile could not be found.</p>
        </div>
      </div>
    );
  }

  const { user, recentLocations, weeklyRank, achievements, qualityRatio } = profile;

  return (
    <div className="public-profile">
      <div className="profile-header">
        <h2>👤 Quality Contributor Profile</h2>
        <p>Public profile of {user.email}</p>
      </div>

      {/* User Stats Card */}
      <div className="user-stats-card">
        <div className="user-info">
          <div className="user-avatar">
            <span className="avatar-icon">👤</span>
          </div>
          <div className="user-details">
            <h3 className="user-email">{user.email}</h3>
            <div className="trust-level-display">
              <span 
                className="trust-level-badge"
                style={{ color: getTrustLevelColor(user.trustLevel) }}
              >
                {getTrustLevelIcon(user.trustLevel)} {user.trustLevel}
              </span>
              {weeklyRank && (
                <span className="weekly-rank">
                  🏆 Weekly Rank: #{weeklyRank}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-icon">📊</span>
            <div className="stat-content">
              <span className="stat-value">{user.reputationScore}</span>
              <span className="stat-label">Reputation Score</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">📍</span>
            <div className="stat-content">
              <span className="stat-value">{user.totalLocationsCount}</span>
              <span className="stat-label">Total Locations</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <div className="stat-content">
              <span className="stat-value">{user.qualityLocationsCount}</span>
              <span className="stat-label">Quality Locations</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">📈</span>
            <div className="stat-content">
              <span className="stat-value">
                {user.averageLocationRating ? user.averageLocationRating.toFixed(1) : 'N/A'}
              </span>
              <span className="stat-label">Average Rating</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">🎯</span>
            <div className="stat-content">
              <span className="stat-value">{Math.round(qualityRatio * 100)}%</span>
              <span className="stat-label">Quality Ratio</span>
            </div>
          </div>

          <div className="stat-item">
            <span className="stat-icon">📅</span>
            <div className="stat-content">
              <span className="stat-value">
                {user.lastReputationUpdate ? formatDate(user.lastReputationUpdate) : 'N/A'}
              </span>
              <span className="stat-label">Last Updated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      {achievements && Object.keys(achievements).length > 0 && (
        <div className="achievements-section">
          <h3>🏆 Achievements</h3>
          <div className="achievements-grid">
            {Object.entries(achievements).map(([key, achievement]) => (
              <div 
                key={key} 
                className={`achievement-item ${achievement.completed ? 'completed' : ''}`}
              >
                <span className="achievement-icon">
                  {achievement.completed ? '✅' : '⏳'}
                </span>
                <div className="achievement-content">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                  <div className="achievement-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {achievement.progress} / {achievement.target}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recentLocations && recentLocations.length > 0 && (
        <div className="recent-activity-section">
          <h3>📝 Recent Activity</h3>
          <div className="activity-list">
            {recentLocations.map((location) => (
              <div key={location.id} className="activity-item">
                <div className="activity-content">
                  <p className="activity-text">
                    {location.content?.text?.substring(0, 100)}...
                  </p>
                  <div className="activity-meta">
                    <span className="activity-date">
                      {formatDate(location.createdAt)}
                    </span>
                    <span className="activity-status">
                      {location.locationStatus}
                    </span>
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

      {/* Quality Contributor Badge */}
      {user.qualityLocationsCount >= 5 && (
        <div className="quality-badge-section">
          <div className="quality-badge">
            <span className="badge-icon">⭐</span>
            <div className="badge-content">
              <h4>Quality Contributor</h4>
              <p>This user has consistently contributed high-quality locations to the community.</p>
            </div>
          </div>
        </div>
      )}

      {/* Community Impact */}
      <div className="community-impact-section">
        <h3>🌍 Community Impact</h3>
        <div className="impact-stats">
          <div className="impact-stat">
            <span className="impact-number">{user.qualityLocationsCount}</span>
            <span className="impact-label">Quality Locations Created</span>
          </div>
          <div className="impact-stat">
            <span className="impact-number">{Math.round(qualityRatio * 100)}%</span>
            <span className="impact-label">Quality Consistency</span>
          </div>
          <div className="impact-stat">
            <span className="impact-number">{user.reputationScore}</span>
            <span className="impact-label">Reputation Points Earned</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile; 