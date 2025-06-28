import React, { useState } from 'react';
import './NominationStatus.css';

const NominationStatus = ({ nomination, compact = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!nomination) {
    return null;
  }

  const getStatusInfo = () => {
    const now = new Date();
    const expiresAt = new Date(nomination.expiresAt);
    const isExpired = expiresAt < now;

    switch (nomination.status) {
      case 'pending':
        if (isExpired) {
          return {
            text: '⏰ Expired',
            class: 'expired',
            description: 'Nomination expired without enough votes'
          };
        }
        return {
          text: `🗳️ ${nomination.currentVotes}/${nomination.votesRequired} votes`,
          class: 'pending',
          description: 'Waiting for community votes'
        };
      
      case 'approved':
        return {
          text: '✅ Approved',
          class: 'approved',
          description: 'Community approved - waiting for creator response'
        };
      
      case 'accepted':
        return {
          text: '🎉 Official',
          class: 'accepted',
          description: 'Location is now official!'
        };
      
      case 'rejected':
        return {
          text: '❌ Rejected',
          class: 'rejected',
          description: 'Creator rejected the nomination'
        };
      
      case 'failed':
        return {
          text: '❌ Failed',
          class: 'failed',
          description: 'Not enough votes to approve'
        };
      
      default:
        return {
          text: '❓ Unknown',
          class: 'unknown',
          description: 'Unknown nomination status'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isActive = ['pending', 'approved'].includes(nomination.status) && 
                   new Date(nomination.expiresAt) > new Date();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  return (
    <div className={`nomination-status ${statusInfo.class} ${compact ? 'compact' : ''}`}>
      <div className="status-header" onClick={() => isActive && setShowDetails(!showDetails)}>
        <div className="status-text">
          {statusInfo.text}
        </div>
        {isActive && (
          <button 
            className={`details-toggle ${showDetails ? 'expanded' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
          >
            {showDetails ? '▼' : '▶'}
          </button>
        )}
      </div>
      
      {!compact && (
        <div className="status-description">
          {statusInfo.description}
        </div>
      )}

      {/* Show nomination details when expanded */}
      {showDetails && isActive && (
        <div className="nomination-details">
          <div className="detail-item">
            <strong>Nominated by:</strong> {nomination.nominator?.name || nomination.nominator?.email || 'Unknown'}
          </div>
          <div className="detail-item">
            <strong>Reason:</strong> "{nomination.reason || 'No reason provided'}"
          </div>
          <div className="detail-item">
            <strong>Created:</strong> {formatDate(nomination.createdAt)}
          </div>
          <div className="detail-item">
            <strong>Expires:</strong> {formatDate(nomination.expiresAt)} ({getTimeRemaining(nomination.expiresAt)})
          </div>
          {nomination.status === 'pending' && (
            <div className="detail-item">
              <strong>Cost:</strong> 5 credits spent by nominator
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NominationStatus; 