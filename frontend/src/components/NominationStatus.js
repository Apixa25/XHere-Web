import React from 'react';
import './NominationStatus.css';

const NominationStatus = ({ nomination, compact = false }) => {
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

  return (
    <div className={`nomination-status ${statusInfo.class} ${compact ? 'compact' : ''}`}>
      <div className="status-text">
        {statusInfo.text}
      </div>
      {!compact && (
        <div className="status-description">
          {statusInfo.description}
        </div>
      )}
    </div>
  );
};

export default NominationStatus; 