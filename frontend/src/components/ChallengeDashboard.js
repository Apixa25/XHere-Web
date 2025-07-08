import React, { useState, useEffect } from 'react';
import './ChallengeDashboard.css';

const ChallengeDashboard = ({ user, API_URL }) => {
  console.log('🔍 ChallengeDashboard: Component rendered with user:', user?.id, 'API_URL:', API_URL);
  
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionData, setSubmissionData] = useState({
    locationId: '',
    submissionText: ''
  });

  useEffect(() => {
    console.log('🔍 ChallengeDashboard: useEffect triggered');
    console.log('🔍 ChallengeDashboard: API_URL =', API_URL);
    console.log('🔍 ChallengeDashboard: user =', user?.id);
    
    if (!API_URL) {
      console.error('❌ ChallengeDashboard: API_URL is undefined!');
      return;
    }
    
    console.log('🔍 ChallengeDashboard: About to call fetchActiveChallenges');
    fetchActiveChallenges();
    console.log('🔍 ChallengeDashboard: About to call fetchUserSubmissions');
    fetchUserSubmissions();
    console.log('🔍 ChallengeDashboard: useEffect completed');
  }, [API_URL, user?.id]);

  const fetchActiveChallenges = async () => {
    console.log('🔍 ChallengeDashboard: Starting fetchActiveChallenges');
    try {
      const url = `${API_URL}/api/challenges`;
      console.log('🔍 ChallengeDashboard: Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('🔍 ChallengeDashboard: Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch challenges');
      }

      const data = await response.json();
      console.log('🔍 ChallengeDashboard: Received data:', data);
      setChallenges(data);
    } catch (error) {
      console.error('❌ ChallengeDashboard: Error fetching challenges:', error);
      setError('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmissions = async () => {
    console.log('🔍 ChallengeDashboard: Starting fetchUserSubmissions');
    try {
      const url = `${API_URL}/api/challenges/user/submissions`;
      console.log('🔍 ChallengeDashboard: Fetching from URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('🔍 ChallengeDashboard: Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch user submissions');
      }

      const data = await response.json();
      console.log('🔍 ChallengeDashboard: Received submissions data:', data);
      setUserSubmissions(data);
    } catch (error) {
      console.error('❌ ChallengeDashboard: Error fetching user submissions:', error);
    }
  };

  const fetchChallengeDetails = async (challengeId) => {
    try {
      const response = await fetch(`${API_URL}/api/challenges/${challengeId}?includeSubmissions=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch challenge details');
      }

      const data = await response.json();
      setSelectedChallenge(data);
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      setError('Failed to load challenge details');
    }
  };

  const handleChallengeClick = (challenge) => {
    setSelectedChallenge(challenge);
    fetchChallengeDetails(challenge.id);
  };

  const handleSubmitLocation = async (e) => {
    e.preventDefault();
    
    if (!submissionData.locationId || !submissionData.submissionText) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/challenges/${selectedChallenge.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit location');
      }

      const submission = await response.json();
      console.log('✅ Location submitted successfully:', submission);
      
      // Refresh data
      fetchChallengeDetails(selectedChallenge.id);
      fetchUserSubmissions();
      
      // Reset form
      setSubmissionData({ locationId: '', submissionText: '' });
      setShowSubmissionModal(false);
      setError(null);
    } catch (error) {
      console.error('Error submitting location:', error);
      setError(error.message);
    }
  };

  const handleVote = async (submissionId, voteType) => {
    try {
      const response = await fetch(`${API_URL}/api/challenges/submissions/${submissionId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ voteType })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to vote');
      }

      // Refresh challenge details to get updated vote counts
      fetchChallengeDetails(selectedChallenge.id);
    } catch (error) {
      console.error('Error voting:', error);
      setError(error.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTimeRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { class: 'status-active', text: '🟢 Active' },
      voting: { class: 'status-voting', text: '🗳️ Voting' },
      completed: { class: 'status-completed', text: '🏆 Completed' },
      draft: { class: 'status-draft', text: '📝 Draft' }
    };
    
    const config = statusConfig[status] || { class: 'status-default', text: status };
    return <span className={`status-badge ${config.class}`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <div className="challenge-dashboard">
        <div className="loading-spinner">🔄 Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="challenge-dashboard">
      <div className="challenge-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🎯 Community Challenges</h1>
            <p>Discover amazing locations and compete with the community!</p>
          </div>
          <div className="header-right">
            <button 
              className="back-to-map-btn"
              onClick={() => window.location.href = '/'}
            >
              🗺️ Back to Map
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="challenge-content">
        <div className="challenges-list">
          <h2>🏆 Active Challenges</h2>
          {challenges.length === 0 ? (
            <div className="no-challenges">
              <p>No active challenges at the moment. Check back soon!</p>
            </div>
          ) : (
            challenges.map(challenge => (
              <div 
                key={challenge.id} 
                className={`challenge-card ${selectedChallenge?.id === challenge.id ? 'selected' : ''}`}
                onClick={() => handleChallengeClick(challenge)}
              >
                <div className="challenge-card-header">
                  <h3>{challenge.title}</h3>
                  {getStatusBadge(challenge.status)}
                </div>
                <p className="challenge-description">{challenge.description}</p>
                <div className="challenge-meta">
                  <span>⏰ Ends: {formatDate(challenge.endDate)}</span>
                  <span>⏳ {getTimeRemaining(challenge.endDate)}</span>
                </div>
                {challenge.featured && (
                  <div className="featured-badge">⭐ Featured</div>
                )}
              </div>
            ))
          )}
        </div>

        {selectedChallenge && (
          <div className="challenge-details">
            <div className="challenge-details-header">
              <h2>{selectedChallenge.title}</h2>
              <button 
                className="submit-location-btn"
                onClick={() => setShowSubmissionModal(true)}
                disabled={selectedChallenge.status !== 'active'}
              >
                📝 Submit Location
              </button>
            </div>

            <div className="challenge-info">
              <p>{selectedChallenge.description}</p>
              <div className="challenge-stats">
                <span>📅 Started: {formatDate(selectedChallenge.startDate)}</span>
                <span>⏰ Ends: {formatDate(selectedChallenge.endDate)}</span>
                <span>⏳ {getTimeRemaining(selectedChallenge.endDate)}</span>
              </div>
            </div>

            {selectedChallenge.submissions && selectedChallenge.submissions.length > 0 && (
              <div className="submissions-section">
                <h3>📋 Submissions ({selectedChallenge.submissions.length})</h3>
                <div className="submissions-list">
                  {selectedChallenge.submissions.map(submission => (
                    <div key={submission.id} className="submission-card">
                      <div className="submission-header">
                        <span className="user-name">{submission.user?.email || 'Anonymous'}</span>
                        <div className="submission-score">
                          <span className="score">Score: {submission.score}</span>
                          <span className="votes">Votes: {submission.voteCount}</span>
                        </div>
                      </div>
                      
                      <div className="submission-location">
                        <strong>{submission.location?.content?.text || 'Location'}</strong>
                        <span className="location-type">{submission.location?.locationType}</span>
                      </div>
                      
                      {submission.submissionText && (
                        <p className="submission-text">{submission.submissionText}</p>
                      )}
                      
                      {selectedChallenge.status === 'voting' && (
                        <div className="voting-buttons">
                          <button 
                            onClick={() => handleVote(submission.id, 'upvote')}
                            className="vote-btn upvote"
                          >
                            👍 Upvote
                          </button>
                          <button 
                            onClick={() => handleVote(submission.id, 'downvote')}
                            className="vote-btn downvote"
                          >
                            👎 Downvote
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📝 Submit Location for Challenge</h3>
              <button onClick={() => setShowSubmissionModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleSubmitLocation}>
              <div className="form-group">
                <label>Location ID:</label>
                <input
                  type="text"
                  value={submissionData.locationId}
                  onChange={(e) => setSubmissionData({...submissionData, locationId: e.target.value})}
                  placeholder="Enter the location ID you want to submit"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Why does this location fit the challenge?</label>
                <textarea
                  value={submissionData.submissionText}
                  onChange={(e) => setSubmissionData({...submissionData, submissionText: e.target.value})}
                  placeholder="Explain why this location is perfect for this challenge..."
                  rows="4"
                  required
                />
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowSubmissionModal(false)}>
                  Cancel
                </button>
                <button type="submit">
                  Submit Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengeDashboard; 