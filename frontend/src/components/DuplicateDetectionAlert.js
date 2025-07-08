import React, { useState, useEffect } from 'react';
import './DuplicateDetectionAlert.css';

/**
 * 🛡️ Duplicate Detection Alert Component
 * Displays warnings and alerts for potential duplicate locations
 */
const DuplicateDetectionAlert = ({ 
  analysis, 
  onDismiss, 
  onProceed, 
  onModify,
  isVisible = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible || !analysis) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'high_risk':
        return '#ff4444';
      case 'medium_risk':
        return '#ff8800';
      case 'low_risk':
        return '#ffaa00';
      default:
        return '#00aa00';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'high_risk':
        return '🚨';
      case 'medium_risk':
        return '⚠️';
      case 'low_risk':
        return '🔍';
      default:
        return '✅';
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'high_risk':
        return 'High Risk Duplicate Detected';
      case 'medium_risk':
        return 'Potential Duplicate Detected';
      case 'low_risk':
        return 'Similar Location Found';
      default:
        return 'No Duplicates Found';
    }
  };

  const renderDuplicateFlags = () => {
    if (!analysis.duplicateFlags || analysis.duplicateFlags.length === 0) {
      return null;
    }

    return (
      <div className="duplicate-flags">
        <h4>🔍 Detection Results:</h4>
        {analysis.duplicateFlags.map((flag, index) => (
          <div key={index} className={`flag-item ${flag.severity}`}>
            <span className="flag-icon">
              {flag.severity === 'high' ? '🚨' : flag.severity === 'medium' ? '⚠️' : '🔍'}
            </span>
            <span className="flag-description">{flag.description}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderSimilarLocations = () => {
    if (!analysis.similarCoordinates || analysis.similarCoordinates.length === 0) {
      return null;
    }

    return (
      <div className="similar-locations">
        <h4>📍 Similar Locations Nearby:</h4>
        {analysis.similarCoordinates.slice(0, 3).map((location, index) => (
          <div key={index} className="similar-location-item">
            <div className="location-info">
              <span className="location-text">{location.content.text}</span>
              <span className="location-distance">
                {location.distance ? `${Math.round(location.distance)}m away` : 'Nearby'}
              </span>
            </div>
            <div className="location-creator">
              by {location.creator?.profile?.username || location.creator?.email || 'Unknown'}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!analysis.recommendations || analysis.recommendations.length === 0) {
      return null;
    }

    return (
      <div className="recommendations">
        <h4>💡 Recommendations:</h4>
        {analysis.recommendations.map((rec, index) => (
          <div key={index} className={`recommendation-item ${rec.priority}`}>
            <span className="rec-icon">
              {rec.action === 'reject' ? '❌' : rec.action === 'review' ? '🔍' : '⚠️'}
            </span>
            <span className="rec-text">{rec.reason}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="duplicate-detection-alert" style={{ borderColor: getStatusColor(analysis.duplicateStatus) }}>
      <div className="alert-header">
        <div className="status-indicator">
          <span className="status-icon">{getStatusIcon(analysis.duplicateStatus)}</span>
          <span className="status-text">{getStatusMessage(analysis.duplicateStatus)}</span>
          <span className="risk-score">Risk Score: {analysis.totalRiskScore}</span>
        </div>
        
        <div className="alert-actions">
          <button 
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <button 
            className="dismiss-button"
            onClick={onDismiss}
          >
            ✕
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="alert-details">
          {renderDuplicateFlags()}
          {renderSimilarLocations()}
          {renderRecommendations()}
          
          <div className="action-buttons">
            {analysis.duplicateStatus === 'high_risk' ? (
              <button 
                className="modify-button primary"
                onClick={onModify}
              >
                📝 Modify Location
              </button>
            ) : (
              <>
                <button 
                  className="proceed-button primary"
                  onClick={onProceed}
                >
                  ✅ Proceed Anyway
                </button>
                <button 
                  className="modify-button secondary"
                  onClick={onModify}
                >
                  📝 Modify Location
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!isExpanded && (
        <div className="alert-summary">
          <p>
            {analysis.duplicateStatus === 'high_risk' 
              ? 'This location appears to be a duplicate. Please review and modify your submission.'
              : analysis.duplicateStatus === 'medium_risk'
              ? 'Similar locations found nearby. Consider reviewing before proceeding.'
              : 'Similar content detected. Please ensure this is unique.'
            }
          </p>
          <button 
            className="expand-details-button"
            onClick={() => setIsExpanded(true)}
          >
            View Details
          </button>
        </div>
      )}
    </div>
  );
};

export default DuplicateDetectionAlert; 