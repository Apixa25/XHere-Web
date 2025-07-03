import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './TrustBasedPostingInfo.css';

const TrustBasedPostingInfo = ({ userData, onPostingCheck }) => {
  const [postingInfo, setPostingInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userData?.id) {
      loadPostingInfo();
    }
  }, [userData]);

  const loadPostingInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current reputation and posting permissions
      const [reputationResponse, permissionResponse] = await Promise.all([
        api.get('/reputation/current'),
        api.get('/downvotes/posting-permission')
      ]);

      const reputation = reputationResponse.data;
      const permission = permissionResponse.data.permission;

      setPostingInfo({
        reputation,
        permission,
        trustLevel: userData.trustLevel,
        reputationScore: userData.reputationScore
      });

      // Notify parent component
      if (onPostingCheck) {
        onPostingCheck({
          canPost: permission.canPost,
          restrictions: permission.restrictions,
          trustLevel: userData.trustLevel
        });
      }
    } catch (error) {
      console.error('Error loading posting info:', error);
      setError('Failed to load posting information');
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevelColor = (trustLevel) => {
    switch (trustLevel) {
      case 'new': return '#ff6b6b';
      case 'trusted': return '#4ecdc4';
      case 'verified': return '#45b7d1';
      case 'moderator': return '#96ceb4';
      default: return '#95a5a6';
    }
  };

  const getTrustLevelIcon = (trustLevel) => {
    switch (trustLevel) {
      case 'new': return '🆕';
      case 'trusted': return '✅';
      case 'verified': return '🔒';
      case 'moderator': return '👑';
      default: return '👤';
    }
  };

  const getNextTrustLevel = (currentTrustLevel) => {
    const levels = ['new', 'trusted', 'verified', 'moderator'];
    const currentIndex = levels.indexOf(currentTrustLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  };

  const getProgressToNext = (currentScore, trustLevel) => {
    const thresholds = {
      new: 100,
      trusted: 500,
      verified: 2000,
      moderator: 999999
    };
    
    const currentThreshold = thresholds[trustLevel] || 0;
    const nextThreshold = getNextTrustLevel(trustLevel) ? thresholds[getNextTrustLevel(trustLevel)] : currentThreshold;
    
    if (nextThreshold === currentThreshold) return 100;
    
    const progress = ((currentScore - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (loading) {
    return (
      <div className="trust-posting-info loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading posting privileges...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trust-posting-info error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={loadPostingInfo} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  if (!postingInfo) {
    return null;
  }

  const { reputation, permission, trustLevel, reputationScore } = postingInfo;
  const nextTrustLevel = getNextTrustLevel(trustLevel);
  const progressToNext = getProgressToNext(reputationScore, trustLevel);

  return (
    <div className="trust-posting-info">
      {/* Trust Level Display */}
      <div className="trust-level-section">
        <div className="trust-level-header">
          <span className="trust-level-icon">{getTrustLevelIcon(trustLevel)}</span>
          <h3>Trust Level: {trustLevel.charAt(0).toUpperCase() + trustLevel.slice(1)}</h3>
        </div>
        
        <div className="trust-level-details">
          <div className="reputation-score">
            <span className="score-label">Reputation Score:</span>
            <span className="score-value" style={{ color: getTrustLevelColor(trustLevel) }}>
              {reputationScore}
            </span>
          </div>
          
          {nextTrustLevel && (
            <div className="progress-section">
              <div className="progress-label">
                Progress to {nextTrustLevel.charAt(0).toUpperCase() + nextTrustLevel.slice(1)}:
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${progressToNext}%`,
                    backgroundColor: getTrustLevelColor(nextTrustLevel)
                  }}
                />
              </div>
              <span className="progress-text">{Math.round(progressToNext)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Posting Restrictions */}
      <div className="posting-restrictions-section">
        <h4>📝 Posting Privileges</h4>
        
        <div className="restrictions-grid">
          <div className="restriction-item">
            <span className="restriction-label">Can Post:</span>
            <span className={`restriction-value ${permission.canPost ? 'allowed' : 'denied'}`}>
              {permission.canPost ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div className="restriction-item">
            <span className="restriction-label">Daily Limit:</span>
            <span className="restriction-value">
              {permission.restrictions.maxLocationsPerDay} locations
            </span>
          </div>
          
          <div className="restriction-item">
            <span className="restriction-label">Requires Approval:</span>
            <span className={`restriction-value ${permission.restrictions.requiresApproval ? 'required' : 'not-required'}`}>
              {permission.restrictions.requiresApproval ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div className="restriction-item">
            <span className="restriction-label">Credit Cost (Paid):</span>
            <span className="restriction-value">
              💰 {permission.restrictions.creditCost}
            </span>
          </div>
        </div>

        {!permission.canPost && (
          <div className="posting-blocked">
            <div className="blocked-icon">🚫</div>
            <div className="blocked-message">
              <strong>Posting Restricted</strong>
              <p>Your posting privileges are currently restricted. Build your reputation to unlock more posting capacity.</p>
            </div>
          </div>
        )}
      </div>

      {/* Penalty Information */}
      {permission.penaltyLevel && permission.penaltyLevel !== 'none' && (
        <div className="penalty-section">
          <h4>⚠️ Active Penalty</h4>
          <div className="penalty-info">
            <div className="penalty-level">
              <span className="penalty-label">Penalty Level:</span>
              <span className={`penalty-value ${permission.penaltyLevel}`}>
                {permission.penaltyLevel.charAt(0).toUpperCase() + permission.penaltyLevel.slice(1)}
              </span>
            </div>
            
            {permission.penaltyExpiresAt && (
              <div className="penalty-expiry">
                <span className="expiry-label">Expires:</span>
                <span className="expiry-value">
                  {new Date(permission.penaltyExpiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
            
            <div className="penalty-note">
              <p>⚠️ Penalty restrictions override your trust level privileges.</p>
            </div>
          </div>
        </div>
      )}

      {/* Trust Level Benefits */}
      <div className="trust-benefits-section">
        <h4>🎯 Trust Level Benefits</h4>
        <div className="benefits-grid">
          <div className="benefit-item">
            <span className="benefit-icon">🆕</span>
            <div className="benefit-content">
              <strong>New Users</strong>
              <p>3 locations/day, requires approval, 100 credits</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <span className="benefit-icon">✅</span>
            <div className="benefit-content">
              <strong>Trusted Users</strong>
              <p>10 locations/day, auto-approval, 50 credits</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <span className="benefit-icon">🔒</span>
            <div className="benefit-content">
              <strong>Verified Users</strong>
              <p>25 locations/day, auto-approval, 25 credits</p>
            </div>
          </div>
          
          <div className="benefit-item">
            <span className="benefit-icon">👑</span>
            <div className="benefit-content">
              <strong>Moderators</strong>
              <p>50 locations/day, auto-approval, 10 credits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips for Improvement */}
      <div className="improvement-tips">
        <h4>💡 Tips to Improve Your Trust Level</h4>
        <ul className="tips-list">
          <li>✅ Post high-quality, accurate locations</li>
          <li>📸 Include clear photos and descriptions</li>
          <li>👍 Receive positive ratings from the community</li>
          <li>🔄 Maintain consistent posting quality</li>
          <li>🚫 Avoid downvotes by following community guidelines</li>
        </ul>
      </div>
    </div>
  );
};

export default TrustBasedPostingInfo; 