import React, { useState } from 'react';
import api from '../services/api';
import './CreatorResponseButton.css';

const CreatorResponseButton = ({ nomination, onResponseSuccess, onResponseError }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Get current user id safely
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))?.id;
    } catch {
      return null;
    }
  })();

  // Only show if user is the location creator and nomination is approved
  if (currentUserId !== nomination.location?.creatorId || 
      nomination.status !== 'approved') {
    return null;
  }

  const handleResponse = async (response) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiResponse = await api.respondToNomination(nomination.id, response);
      
      if (apiResponse.success) {
        setShowModal(false);
        if (onResponseSuccess) {
          onResponseSuccess(apiResponse.nomination);
        }
      } else {
        setError(apiResponse.message || 'Failed to respond to nomination');
      }
    } catch (error) {
      console.error('Error responding to nomination:', error);
      setError(error.message || 'Failed to respond to nomination');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className="creator-response-button"
        title="Respond to community nomination"
      >
        🎯 Respond to Nomination
      </button>

      {showModal && (
        <div className="creator-response-modal-overlay">
          <div className="creator-response-modal">
            <div className="creator-response-modal-header">
              <h3>🎯 Respond to Community Nomination</h3>
              <button 
                onClick={handleCancel}
                className="close-button"
                disabled={isLoading}
              >
                ×
              </button>
            </div>

            <div className="creator-response-modal-content">
              <div className="nomination-summary">
                <h4>Nomination Summary</h4>
                <div className="summary-item">
                  <strong>Location:</strong> {nomination.location?.content?.text || 'Unknown'}
                </div>
                <div className="summary-item">
                  <strong>Nominated by:</strong> {nomination.nominator?.name || nomination.nominator?.email || 'Unknown'}
                </div>
                <div className="summary-item">
                  <strong>Reason:</strong> "{nomination.reason}"
                </div>
                <div className="summary-item">
                  <strong>Community Votes:</strong> {nomination.currentVotes}/{nomination.votesRequired} ✅
                </div>
              </div>

              <div className="response-options">
                <h4>Your Response</h4>
                <p className="response-description">
                  The community has approved this nomination. You can now accept to make your location official, 
                  or reject it if you prefer to keep it unofficial.
                </p>

                <div className="response-buttons">
                  <button
                    onClick={() => handleResponse('accept')}
                    disabled={isLoading}
                    className="response-button accept-button"
                  >
                    ✅ Accept - Make Official
                  </button>
                  <button
                    onClick={() => handleResponse('reject')}
                    disabled={isLoading}
                    className="response-button reject-button"
                  >
                    ❌ Reject - Keep Unofficial
                  </button>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}

              <div className="creator-response-modal-actions">
                <button
                  onClick={handleCancel}
                  className="cancel-button"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatorResponseButton; 