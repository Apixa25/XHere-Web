import React, { useState, useEffect } from 'react';
import './TrustBasedPostingInfo.css';

const TrustBasedPostingInfo = ({ userData }) => {
  const [postingInfo, setPostingInfo] = useState(null);

  useEffect(() => {
    if (userData) {
      // Calculate posting info based on user data
      const trustLevel = userData.trustLevel || 'new';
      const reputationScore = userData.reputationScore || 0;
      const downvoteCount = userData.totalDownvotes || 0;
      
      // Determine posting permissions based on trust level and downvotes
      const postingPermissions = calculatePostingPermissions(trustLevel, reputationScore, downvoteCount);
      
      setPostingInfo({
        trustLevel,
        reputationScore,
        downvoteCount,
        permissions: postingPermissions
      });
    }
  }, [userData]);

  const calculatePostingPermissions = (trustLevel, reputationScore, downvoteCount) => {
    // Base permissions by trust level
    const basePermissions = {
      new: {
        canPost: true,
        maxLocationsPerDay: 3,
        requiresApproval: true,
        creditCost: 100,
        reviewPeriod: '24-48 hours'
      },
      trusted: {
        canPost: true,
        maxLocationsPerDay: 10,
        requiresApproval: false,
        creditCost: 100,
        reviewPeriod: 'Instant'
      },
      verified: {
        canPost: true,
        maxLocationsPerDay: 25,
        requiresApproval: false,
        creditCost: 100,
        reviewPeriod: 'Instant'
      },
      moderator: {
        canPost: true,
        maxLocationsPerDay: 50,
        requiresApproval: false,
        creditCost: 100,
        reviewPeriod: 'Instant'
      }
    };

    let permissions = { ...basePermissions[trustLevel] };

    // Apply downvote penalties
    if (downvoteCount >= 50) {
      permissions.canPost = false;
      permissions.restriction = 'Banned due to excessive downvotes';
    } else if (downvoteCount >= 30) {
      permissions.maxLocationsPerDay = Math.max(1, permissions.maxLocationsPerDay - 5);
      permissions.requiresApproval = true;
      permissions.restriction = 'Suspended due to downvotes';
    } else if (downvoteCount >= 15) {
      permissions.maxLocationsPerDay = Math.max(3, permissions.maxLocationsPerDay - 3);
      permissions.restriction = 'Restricted due to downvotes';
    } else if (downvoteCount >= 5) {
      permissions.maxLocationsPerDay = Math.max(5, permissions.maxLocationsPerDay - 2);
      permissions.restriction = 'Warning due to downvotes';
    }

    return permissions;
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

  if (!postingInfo) {
    return (
      <div className="trust-posting-info loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading posting privileges...</p>
      </div>
    );
  }

  const { trustLevel, reputationScore, downvoteCount, permissions } = postingInfo;
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
            <span className={`restriction-value ${permissions.canPost ? 'allowed' : 'denied'}`}>
              {permissions.canPost ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div className="restriction-item">
            <span className="restriction-label">Daily Limit:</span>
            <span className="restriction-value">
              {permissions.maxLocationsPerDay} locations
            </span>
          </div>
          
          <div className="restriction-item">
            <span className="restriction-label">Requires Approval:</span>
            <span className={`restriction-value ${permissions.requiresApproval ? 'required' : 'not-required'}`}>
              {permissions.requiresApproval ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          
          <div className="restriction-item">
            <span className="restriction-label">Credit Cost (Paid):</span>
            <span className="restriction-value">
              💰 {permissions.creditCost}
            </span>
          </div>
          
          <div className="restriction-item">
            <span className="restriction-label">Review Period:</span>
            <span className="restriction-value">
              {permissions.reviewPeriod}
            </span>
          </div>
        </div>

        {!permissions.canPost && (
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
      {permissions.restriction && (
        <div className="penalty-section">
          <h4>⚠️ Active Restriction</h4>
          <div className="penalty-info">
            <div className="penalty-level">
              <span className="penalty-label">Restriction:</span>
              <span className="penalty-value">
                {permissions.restriction}
              </span>
            </div>
            
            <div className="penalty-note">
              <p>⚠️ Downvote restrictions override your trust level privileges.</p>
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