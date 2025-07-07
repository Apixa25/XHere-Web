import React, { useState, useEffect } from 'react';
import './Achievements.css';

const Achievements = () => {
  const [achievements, setAchievements] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/leaderboard/achievements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load achievements');
      }

      const data = await response.json();
      setAchievements(data.data || {});
    } catch (err) {
      console.error('Error loading achievements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (achievementKey) => {
    const icons = {
      qualityContributor: '⭐',
      consistentQuality: '🎯',
      communityHelper: '🤝',
      trustedExpert: '👑',
      qualityMaster: '💎',
      consistencyKing: '👑'
    };
    return icons[achievementKey] || '🏆';
  };

  const getAchievementColor = (achievementKey) => {
    const colors = {
      qualityContributor: '#FFD700',
      consistentQuality: '#4CAF50',
      communityHelper: '#2196F3',
      trustedExpert: '#9C27B0',
      qualityMaster: '#E91E63',
      consistencyKing: '#8BC34A'
    };
    return colors[achievementKey] || '#667eea';
  };

  const getProgressPercentage = (achievement) => {
    if (achievement.target === 0) return 0;
    return Math.min(100, (achievement.progress / achievement.target) * 100);
  };

  if (loading) {
    return (
      <div className="achievements">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="achievements">
        <div className="error-message">
          <h3>❌ Error Loading Achievements</h3>
          <p>{error}</p>
          <button onClick={loadAchievements} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const achievementList = Object.entries(achievements);

  return (
    <div className="achievements">
      <div className="achievements-header">
        <div className="header-top">
          <h2>🏆 Quality Contributor Achievements</h2>
          <button 
            onClick={() => window.history.back()} 
            className="back-to-map-button"
          >
            ← Back to Map
          </button>
        </div>
        <p>Track your progress towards becoming a recognized quality contributor</p>
      </div>

      <div className="achievements-grid">
        {achievementList.map(([key, achievement]) => (
          <div 
            key={key} 
            className={`achievement-card ${achievement.completed ? 'completed' : ''}`}
            style={{ borderColor: getAchievementColor(key) }}
          >
            <div className="achievement-header">
              <span 
                className="achievement-icon"
                style={{ color: getAchievementColor(key) }}
              >
                {getAchievementIcon(key)}
              </span>
              <div className="achievement-info">
                <h3 className="achievement-name">{achievement.name}</h3>
                <p className="achievement-description">{achievement.description}</p>
              </div>
              {achievement.completed && (
                <span className="completion-badge">✅</span>
              )}
            </div>

            <div className="achievement-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${getProgressPercentage(achievement)}%`,
                    backgroundColor: getAchievementColor(key)
                  }}
                ></div>
              </div>
              <div className="progress-text">
                <span className="progress-numbers">
                  {achievement.progress} / {achievement.target}
                </span>
                <span className="progress-percentage">
                  {Math.round(getProgressPercentage(achievement))}%
                </span>
              </div>
            </div>

            {/* Special display for quality ratio achievements */}
            {achievement.qualityRatio !== undefined && (
              <div className="quality-ratio-display">
                <span className="ratio-label">Current Quality Ratio:</span>
                <span className="ratio-value">
                  {Math.round(achievement.qualityRatio * 100)}%
                </span>
                <span className="ratio-target">
                  Target: {achievement.key === 'consistentQuality' ? '80%' : '90%'}
                </span>
              </div>
            )}

            {achievement.completed && (
              <div className="completion-message">
                🎉 Achievement Unlocked!
              </div>
            )}
          </div>
        ))}
      </div>

      {achievementList.length === 0 && (
        <div className="empty-state">
          <p>No achievements available yet.</p>
          <p>Start contributing quality locations to unlock achievements!</p>
        </div>
      )}

      <div className="achievements-summary">
        <h3>📊 Achievement Summary</h3>
        <div className="summary-stats">
          <div className="summary-stat">
            <span className="stat-number">
              {achievementList.filter(([_, achievement]) => achievement.completed).length}
            </span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="summary-stat">
            <span className="stat-number">
              {achievementList.length}
            </span>
            <span className="stat-label">Total</span>
          </div>
          <div className="summary-stat">
            <span className="stat-number">
              {Math.round(
                (achievementList.filter(([_, achievement]) => achievement.completed).length / 
                achievementList.length) * 100
              )}%
            </span>
            <span className="stat-label">Completion Rate</span>
          </div>
        </div>
      </div>

      <div className="achievements-actions">
        <button onClick={loadAchievements} className="refresh-button">
          🔄 Refresh Achievements
        </button>
      </div>
    </div>
  );
};

export default Achievements; 