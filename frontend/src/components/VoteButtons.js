import React, { useState } from 'react';
import api from '../services/api';

const VoteButtons = ({ location, onVoteUpdate }) => {
  const [isVoting, setIsVoting] = useState(false);
  
  const VERIFICATION_THRESHOLD = 5;
  const PENDING_THRESHOLD = 2;

  const getVerificationProgress = () => {
    const points = location.totalPoints || 0;
    if (points >= VERIFICATION_THRESHOLD) return null;
    
    const nextThreshold = points < PENDING_THRESHOLD ? PENDING_THRESHOLD : VERIFICATION_THRESHOLD;
    const pointsNeeded = nextThreshold - points;
    
    return (
      <span style={{
        fontSize: '12px',
        color: '#666',
        marginLeft: '10px'
      }}>
        {points < PENDING_THRESHOLD 
          ? `${pointsNeeded} points until pending` 
          : `${pointsNeeded} points until verified`}
      </span>
    );
  };

  const handleVote = async (voteType) => {
    try {
      setIsVoting(true);
      const response = await api.voteLocation(location.id, voteType);
      console.log('Vote response:', response);
      onVoteUpdate(response.location);
    } catch (error) {
      console.error('Error voting:', error);
      alert(error.message || 'Error recording vote');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button
        onClick={() => handleVote('upvote')}
        disabled={isVoting}
        style={{
          padding: '5px 10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isVoting ? 'default' : 'pointer',
          opacity: isVoting ? 0.7 : 1
        }}
      >
        👍 {location.upvotes || 0}
      </button>
      <button
        onClick={() => handleVote('downvote')}
        disabled={isVoting}
        style={{
          padding: '5px 10px',
          backgroundColor: '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isVoting ? 'default' : 'pointer',
          opacity: isVoting ? 0.7 : 1
        }}
      >
        👎 {location.downvotes || 0}
      </button>
      {getVerificationProgress()}
    </div>
  );
};

export default VoteButtons; 