import React, { useState } from 'react';
import api from '../services/api';
import './NominationVoteButton.css';

const NominationVoteButton = ({ nomination, onVoteSuccess, onVoteError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current user id safely
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))?.id;
    } catch {
      return null;
    }
  })();

  // Check if user has already voted
  const hasVoted = nomination.votes?.some(vote => vote.voterId === currentUserId);
  const userVote = nomination.votes?.find(vote => vote.voterId === currentUserId);

  // Don't show if user is the nominator or location creator
  if (currentUserId === nomination.nominatorId || 
      currentUserId === nomination.location?.creatorId) {
    return null;
  }

  // Don't show if nomination is not pending
  if (nomination.status !== 'pending') {
    return null;
  }

  // Don't show if nomination has expired
  if (new Date(nomination.expiresAt) < new Date()) {
    return null;
  }

  const handleVote = async (voteType) => {
    if (hasVoted) {
      setError('You have already voted on this nomination');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.voteOnNomination(nomination.id, voteType);
      
      if (response.success) {
        if (onVoteSuccess) {
          onVoteSuccess(response.nomination);
        }
      } else {
        setError(response.message || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting on nomination:', error);
      setError(error.message || 'Failed to vote');
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeRemaining = () => {
    const now = new Date();
    const expiresAt = new Date(nomination.expiresAt);
    const diff = expiresAt - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  return (
    <div className="nomination-vote-container">
      {error && (
        <div className="vote-error-message">
          ❌ {error}
        </div>
      )}
      
      <div className="vote-info">
        <div className="vote-count">
          <span className="vote-number">{nomination.currentVotes}</span>
          <span className="vote-label">/ {nomination.votesRequired} votes</span>
        </div>
        <div className="vote-timer">
          ⏰ {getTimeRemaining()}
        </div>
      </div>

      {hasVoted ? (
        <div className="voted-indicator">
          <span className={`vote-badge ${userVote?.voteType === 'upvote' ? 'upvoted' : 'downvoted'}`}>
            {userVote?.voteType === 'upvote' ? '👍 Voted Yes' : '👎 Voted No'}
          </span>
        </div>
      ) : (
        <div className="vote-buttons">
          <button
            onClick={() => handleVote('upvote')}
            disabled={isLoading}
            className="vote-button upvote-button"
            title="Vote Yes - This location should be official"
          >
            👍 Yes
          </button>
          <button
            onClick={() => handleVote('downvote')}
            disabled={isLoading}
            className="vote-button downvote-button"
            title="Vote No - This location should not be official"
          >
            👎 No
          </button>
        </div>
      )}

      {nomination.status === 'approved' && (
        <div className="nomination-approved">
          ✅ Approved by community! Waiting for creator response...
        </div>
      )}
    </div>
  );
};

export default NominationVoteButton; 