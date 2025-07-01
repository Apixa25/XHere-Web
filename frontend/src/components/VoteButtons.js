import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VoteButtons = ({ location, onVoteUpdate }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [userVoteType, setUserVoteType] = useState(null);
  const [error, setError] = useState(null);

  // Debug logging for location data
  useEffect(() => {
    console.log('🔍 VoteButtons - Location data received:', {
      id: location?.id,
      upvotes: location?.upvotes,
      downvotes: location?.downvotes,
      hasVoters: !!location?.voters,
      votersLength: location?.voters?.length,
      voters: location?.voters
    });
  }, [location]);

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Check user's current vote on component mount and when location updates
  useEffect(() => {
    const checkUserVote = () => {
      if (location?.voters) {
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('🔍 VoteButtons - User from localStorage:', user);
        
        // Try both userId and id
        const userId = user?.userId || user?.id;
        console.log('🔍 VoteButtons - Using userId:', userId);
        console.log('🔍 VoteButtons - Location voters:', location.voters);
        
        const existingVote = location.voters.find(v => v.userId === userId);
        console.log('🔍 VoteButtons - Existing vote found:', existingVote);
        
        setUserVoteType(existingVote ? existingVote.voteType : null);
        console.log('🔍 VoteButtons - Setting userVoteType to:', existingVote ? existingVote.voteType : null);
      }
    };

    checkUserVote();
  }, [location]);

  const handleVote = async (voteType) => {
    if (isVoting) return;
    
    try {
      setIsVoting(true);
      setError(null);
      
      console.log('🔍 VoteButtons - Making vote request:', { locationId: location.id, voteType });
      const response = await api.voteLocation(location.id, voteType);
      console.log('🔍 VoteButtons - Vote response received:', response);
      
      // Check if the response contains an error (from 400 status)
      if (response && response.error) {
        console.log('🔍 VoteButtons - Vote error response:', response.error);
        
        // Handle the specific case where user has already voted this way
        if (response.error.includes('already voted this way')) {
          // Update the user's vote state to reflect they've already voted this way
          setUserVoteType(voteType);
          setError('You have already voted this way');
          console.log('🔄 Vote state updated - user already voted this way:', voteType);
          
          // Also update the location's voters array to keep it in sync
          if (location.voters) {
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user?.userId || user?.id;
            
            // Check if user is already in voters array
            const existingVoteIndex = location.voters.findIndex(v => v.userId === userId);
            if (existingVoteIndex === -1) {
              // Add user to voters array if not present
              location.voters.push({ userId, voteType });
              console.log('🔄 Added user to location voters array');
            } else {
              // Update existing vote
              location.voters[existingVoteIndex] = { userId, voteType };
              console.log('🔄 Updated user vote in location voters array');
            }
            
            // Call onVoteUpdate to sync the parent component
            onVoteUpdate(location);
          }
        } else {
          setError(response.error);
        }
        return;
      }
      
      // Handle successful vote response
      console.log('🔍 VoteButtons - Successful vote response:', response);
      
      // Handle status updates
      if (response && response.statusUpdate) {
        console.log('📍 Location status updated:', response.statusUpdate);
        
        // Show status change notification
        const statusConfig = {
          pending: { color: '#FF9800', icon: '⏳' },
          verified: { color: '#4CAF50', icon: '✅' },
          flagged: { color: '#F44336', icon: '🚩' },
          removed: { color: '#9E9E9E', icon: '🗑️' }
        };
        
        const newConfig = statusConfig[response.statusUpdate.newStatus];
        if (newConfig) {
          // You can add a toast notification here if you have a notification system
          console.log(`${newConfig.icon} Location status changed to ${response.statusUpdate.newStatus}: ${response.statusUpdate.reason}`);
        }
      }
      
      // Update the location with the new vote data
      if (response.location) {
        onVoteUpdate(response.location);
      }
      
      // Update user's vote state
      setUserVoteType(voteType);
      console.log('🔄 Vote state updated - successful vote:', voteType);
    } catch (error) {
      console.error('🔍 VoteButtons - Vote error:', error);
      setError(error.message || 'Error voting');
    } finally {
      setIsVoting(false);
    }
  };

  // Determine if buttons should be disabled
  const upvoteDisabled = isVoting || userVoteType === 'upvote';
  const downvoteDisabled = isVoting || userVoteType === 'downvote';
  
  console.log('🔍 VoteButtons - Button states:', {
    isVoting,
    userVoteType,
    upvoteDisabled,
    downvoteDisabled
  });

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
        <span style={{ 
          color: '#f44336', 
          fontSize: '11px', 
          backgroundColor: '#ffebee',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #ffcdd2',
          display: 'inline-block',
          marginTop: '4px'
        }}>
          ⚠️ {error}
        </span>
      )}
    </div>
  );
};

export default VoteButtons; 