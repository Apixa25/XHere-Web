import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VoteButtons = ({ location, onVoteUpdate }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [userVoteType, setUserVoteType] = useState(null);
  const [error, setError] = useState(null);
  
  // Check user's current vote on component mount and when location updates
  useEffect(() => {
    const checkUserVote = () => {
      if (location?.voters) {
        const userId = JSON.parse(localStorage.getItem('user'))?.userId;
        const existingVote = location.voters.find(v => v.userId === userId);
        console.log('Current user vote:', existingVote);
        setUserVoteType(existingVote ? existingVote.voteType : null);
      }
    };

    checkUserVote();
  }, [location]);

  const handleVote = async (voteType) => {
    if (isVoting) return;
    
    try {
      setIsVoting(true);
      setError(null);
      
      console.log('Attempting to vote:', voteType);
      console.log('Current user vote:', userVoteType);
      
      const response = await api.voteLocation(location.id, voteType);
      
      if (response.error) {
        console.error('Vote error:', response.error);
        setError(response.error);
        return;
      }
      
      console.log('Vote response:', response);
      onVoteUpdate(response.location);
      setUserVoteType(voteType);
    } catch (error) {
      console.error('Vote error:', error);
      setError(error.message || 'Error voting');
    } finally {
      setIsVoting(false);
    }
  };

  // Determine if buttons should be disabled
  const upvoteDisabled = isVoting || userVoteType === 'upvote';
  const downvoteDisabled = isVoting || userVoteType === 'downvote';

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button
        onClick={() => handleVote('upvote')}
        disabled={upvoteDisabled}
        style={{
          padding: '5px 10px',
          backgroundColor: userVoteType === 'upvote' ? '#45a049' : '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: upvoteDisabled ? 'not-allowed' : 'pointer',
          opacity: upvoteDisabled ? 0.7 : 1
        }}
      >
        👍 {location.upvotes || 0}
      </button>
      <button
        onClick={() => handleVote('downvote')}
        disabled={downvoteDisabled}
        style={{
          padding: '5px 10px',
          backgroundColor: userVoteType === 'downvote' ? '#d32f2f' : '#f44336',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: downvoteDisabled ? 'not-allowed' : 'pointer',
          opacity: downvoteDisabled ? 0.7 : 1
        }}
      >
        👎 {location.downvotes || 0}
      </button>
      {error && (
        <span style={{ color: 'red', fontSize: '12px' }}>{error}</span>
      )}
    </div>
  );
};

export default VoteButtons; 