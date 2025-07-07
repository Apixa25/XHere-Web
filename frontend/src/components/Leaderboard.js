import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    loadLeaderboard();
    loadUserRank();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/leaderboard/weekly?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load leaderboard');
      }

      const data = await response.json();
      setLeaderboard(data.data || []);
    } catch (err) {
      console.error('Error loading leaderboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRank = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/leaderboard/rank', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserRank(data.data);
      }
    } catch (err) {
      console.error('Error loading user rank:', err);
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

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <div className="leaderboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <div className="error-message">
          <h3>❌ Error Loading Leaderboard</h3>
          <p>{error}</p>
          <button onClick={loadLeaderboard} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <div className="header-top">
          <h2>🏆 Weekly Quality Contributors</h2>
          <button 
            onClick={() => window.history.back()} 
            className="back-to-map-button"
          >
            ← Back to Map
          </button>
        </div>
        <p>Top contributors based on quality and consistency</p>
      </div>

      {/* User's Current Rank */}
      {userRank && (
        <div className="user-rank-card">
          <div className="rank-info">
            <span className="rank-label">Your Rank:</span>
            <span className="rank-value">
              {userRank.rank ? `#${userRank.rank}` : 'Not ranked'}
            </span>
            <span className="rank-total">out of {userRank.totalParticipants} participants</span>
          </div>
          {userRank.score > 0 && (
            <div className="score-info">
              <span className="score-label">Your Score:</span>
              <span className="score-value">{userRank.score}</span>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard List */}
      <div className="leaderboard-list">
        {leaderboard.map((user, index) => (
          <div key={user.userId} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
            <div className="rank-column">
              <span className="rank-number">{getRankIcon(user.rank)}</span>
            </div>
            
            <div className="user-info">
              <div className="user-header">
                <span className="user-email">{user.email}</span>
                <span 
                  className="trust-level-badge"
                  style={{ color: getTrustLevelColor(user.trustLevel) }}
                >
                  {getTrustLevelIcon(user.trustLevel)} {user.trustLevel}
                </span>
              </div>
              
              <div className="user-stats">
                <span className="stat">
                  📍 {user.weeklyStats.totalLocations} locations
                </span>
                <span className="stat">
                  ⭐ {user.weeklyStats.qualityLocations} quality
                </span>
                <span className="stat">
                  👍 {user.weeklyStats.totalUpvotes} upvotes
                </span>
                <span className="stat">
                  🎯 {Math.round(user.weeklyStats.qualityRatio * 100)}% quality ratio
                </span>
              </div>
            </div>
            
            <div className="score-column">
              <span className="quality-score">{user.qualityScore}</span>
              <span className="score-label">Quality Score</span>
            </div>
          </div>
        ))}
      </div>

      {leaderboard.length === 0 && (
        <div className="empty-state">
          <p>No contributors found for this week.</p>
          <p>Be the first to start contributing quality locations!</p>
        </div>
      )}

      {/* Refresh Button */}
      <div className="leaderboard-actions">
        <button onClick={loadLeaderboard} className="refresh-button">
          🔄 Refresh Leaderboard
        </button>
      </div>
    </div>
  );
};

export default Leaderboard; 