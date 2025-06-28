import React, { useState } from 'react';
import api from '../services/api';
import './NominationButton.css';

const NominationButton = ({ location, onSuccess, onError, compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  // Get current user id safely
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))?.id;
    } catch {
      return null;
    }
  })();

  // Get creator id safely
  const creatorId = location.creator?.id || location.creatorId;

  // Don't show button if user is the creator (should use Make Official instead)
  if (currentUserId === creatorId) {
    return null;
  }

  // Don't show button if location is already official
  if (location.isOfficial) {
    return null;
  }

  const handleNominate = async () => {
    if (!reason.trim()) {
      setError('Please provide a reason for the nomination');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.createNomination(location.id, reason.trim());
      
      if (response.success) {
        setShowModal(false);
        setReason('');
        if (onSuccess) {
          onSuccess(response.nomination);
        }
      } else {
        setError(response.message || 'Failed to create nomination');
      }
    } catch (error) {
      console.error('Error creating nomination:', error);
      setError(error.message || 'Failed to create nomination');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setReason('');
    setError(null);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`nomination-button ${compact ? 'compact' : ''}`}
        title="Nominate this location for official status (5 credits)"
      >
        🏆 Nominate
      </button>

      {showModal && (
        <div className="nomination-modal-overlay">
          <div className="nomination-modal">
            <div className="nomination-modal-header">
              <h3>🏆 Nominate for Official Status</h3>
              <button 
                onClick={handleCancel}
                className="close-button"
                disabled={isLoading}
              >
                ×
              </button>
            </div>

            <div className="nomination-modal-content">
              <div className="location-info">
                <h4>{location.content?.text || 'Location'}</h4>
                <p>Created by: {location.creator?.name || location.creator?.email || 'Unknown'}</p>
              </div>

              <div className="nomination-details">
                <h4>Nomination Process:</h4>
                <ul>
                  <li>💰 <strong>Cost:</strong> 5 credits</li>
                  <li>🗳️ <strong>Voting:</strong> Requires 3 community votes</li>
                  <li>⏰ <strong>Duration:</strong> 7 days to gather votes</li>
                  <li>👤 <strong>Creator Response:</strong> Must accept/reject if approved</li>
                </ul>
              </div>

              <div className="reason-input">
                <label htmlFor="nomination-reason">
                  <strong>Why should this location be official?</strong>
                </label>
                <textarea
                  id="nomination-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this location deserves official status..."
                  rows={4}
                  maxLength={500}
                  disabled={isLoading}
                />
                <div className="character-count">
                  {reason.length}/500 characters
                </div>
              </div>

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}

              <div className="nomination-modal-actions">
                <button
                  onClick={handleCancel}
                  className="cancel-button"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNominate}
                  className="nominate-button"
                  disabled={isLoading || !reason.trim()}
                >
                  {isLoading ? 'Creating...' : '🏆 Create Nomination (5 credits)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NominationButton; 