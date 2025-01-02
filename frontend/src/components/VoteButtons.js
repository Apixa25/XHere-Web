import React, { useState } from 'react';
import api from '../services/api';

const VoteButtons = ({ location, onVoteUpdate }) => {
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteType) => {
    try {
      setIsVoting(true);
      const response = await api.voteLocation(location.id, voteType);
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
      {location.verificationStatus === 'verified' && (
        <span style={{ 
          backgroundColor: '#2196F3',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px'
        }}>
          ✓ Verified
        </span>
      )}
    </div>
  );
};

export default VoteButtons; 