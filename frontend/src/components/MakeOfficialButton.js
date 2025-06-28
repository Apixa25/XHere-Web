import React, { useState } from 'react';
import api from '../services/api';
import './MakeOfficialButton.css';

const MakeOfficialButton = ({ location, onSuccess, onError, compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);

  // Get current user info safely
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  const currentUserId = currentUser?.id;
  const isAdmin = currentUser?.isAdmin;
  const creatorId = location.creator?.id || location.creatorId;
  const isCreator = currentUserId === creatorId;

  // Don't show if location is already official
  if (location.isOfficial) {
    return null;
  }

  const handleMakeOfficial = async (path) => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      
      if (path === 'creator') {
        response = await api.makeLocationOfficial(location.id);
      } else if (path === 'admin') {
        response = await api.adminMakeOfficial(location.id);
      }
      
      if (response?.success) {
        setShowModal(false);
        if (onSuccess) {
          onSuccess(response.location);
        }
      } else {
        setError(response?.message || 'Failed to make location official');
      }
    } catch (error) {
      console.error('Error making location official:', error);
      setError(error.message || 'Failed to make location official');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setError(null);
  };

  const getButtonText = () => {
    if (isAdmin) return '👑 Make Official (Admin)';
    if (isCreator) return '✅ Make Official (3 credits)';
    return '🏆 Nominate for Official';
  };

  const getButtonClass = () => {
    if (isAdmin) return 'make-official-button admin';
    if (isCreator) return 'make-official-button creator';
    return 'make-official-button community';
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`${getButtonClass()} ${compact ? 'compact' : ''}`}
        title={isAdmin ? 'Admin override - no cost' : isCreator ? 'Make your location official (3 credits)' : 'Nominate for community voting (5 credits)'}
      >
        {getButtonText()}
      </button>

      {showModal && (
        <div className="make-official-modal-overlay">
          <div className="make-official-modal">
            <div className="make-official-modal-header">
              <h3>🌟 Make Location Official</h3>
              <button 
                onClick={handleCancel}
                className="close-button"
                disabled={isLoading}
              >
                ×
              </button>
            </div>

            <div className="make-official-modal-content">
              <div className="location-info">
                <h4>{location.content?.text || 'Location'}</h4>
                <p>Created by: {location.creator?.name || location.creator?.email || 'Unknown'}</p>
              </div>

              {isAdmin && (
                <div className="admin-path">
                  <h4>👑 Admin Override</h4>
                  <div className="path-details">
                    <ul>
                      <li>💰 <strong>Cost:</strong> No credits required</li>
                      <li>⚡ <strong>Speed:</strong> Immediate official status</li>
                      <li>🎯 <strong>Use:</strong> For verified locations or corrections</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => handleMakeOfficial('admin')}
                    disabled={isLoading}
                    className="action-button admin-action"
                  >
                    {isLoading ? 'Processing...' : '👑 Make Official (Admin Override)'}
                  </button>
                </div>
              )}

              {isCreator && !isAdmin && (
                <div className="creator-path">
                  <h4>✅ Creator Path</h4>
                  <div className="path-details">
                    <ul>
                      <li>💰 <strong>Cost:</strong> 3 credits</li>
                      <li>⚡ <strong>Speed:</strong> Immediate official status</li>
                      <li>🎯 <strong>Use:</strong> Make your own location official</li>
                      <li>⚠️ <strong>Note:</strong> 150-foot boundary enforcement applies</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => handleMakeOfficial('creator')}
                    disabled={isLoading}
                    className="action-button creator-action"
                  >
                    {isLoading ? 'Processing...' : '✅ Make Official (3 credits)'}
                  </button>
                </div>
              )}

              {!isCreator && !isAdmin && (
                <div className="community-path">
                  <h4>🏆 Community Path</h4>
                  <div className="path-details">
                    <ul>
                      <li>💰 <strong>Cost:</strong> 5 credits</li>
                      <li>🗳️ <strong>Voting:</strong> Requires 3 community votes</li>
                      <li>⏰ <strong>Duration:</strong> 7 days to gather votes</li>
                      <li>👤 <strong>Creator Response:</strong> Must accept/reject if approved</li>
                    </ul>
                  </div>
                  <p className="community-note">
                    This path is for nominating locations created by other users. 
                    The creator will have final say on whether to accept the nomination.
                  </p>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      // This will trigger the nomination flow in the parent component
                      if (onError) {
                        onError('Please use the Nominate button for community nominations');
                      }
                    }}
                    className="action-button community-action"
                  >
                    🏆 Use Nomination Button Instead
                  </button>
                </div>
              )}

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}

              <div className="make-official-modal-actions">
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

export default MakeOfficialButton; 