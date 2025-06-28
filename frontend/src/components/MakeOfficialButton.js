import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MakeOfficialButton = ({ location, onSuccess, onError, compact = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [canMakeOfficial, setCanMakeOfficial] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  useEffect(() => {
    // Check if location can be made official
    const checkCanMakeOfficial = async () => {
      try {
        const response = await api.get(`/locations/${location.id}/can-make-official`);
        setCanMakeOfficial(response.data);
      } catch (error) {
        console.error('Error checking if can make official:', error);
        setCanMakeOfficial({ canMake: false, reason: 'Error checking availability' });
      }
    };

    if (location && !location.isOfficial) {
      checkCanMakeOfficial();
    }
  }, [location]);

  const handleMakeOfficial = async () => {
    setIsLoading(true);
    try {
      const response = await api.post(`/locations/${location.id}/make-official`);
      
      if (response.data.success) {
        setShowConfirmation(false);
        if (onSuccess) {
          onSuccess(response.data);
        }
        // Show success message
        alert(`🎉 Location made official! Spent 3 credits.`);
      }
    } catch (error) {
      console.error('Error making location official:', error);
      const errorMessage = error.response?.data?.message || 'Failed to make location official';
      if (onError) {
        onError(error);
      }
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show button if location is already official
  if (location.isOfficial) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        backgroundColor: '#2196F3',
        color: 'white',
        borderRadius: '12px',
        fontSize: compact ? '10px' : '12px',
        fontWeight: 'bold'
      }}>
        <span>✓</span>
        <span>Official</span>
      </div>
    );
  }

  // Don't show button if user is not logged in
  if (!currentUserId) {
    return null;
  }

  // Don't show button if user is the creator (only non-creators can make locations official)
  if (currentUserId === creatorId) {
    return null;
  }

  // Don't show button if location cannot be made official
  if (canMakeOfficial && !canMakeOfficial.canMake) {
    return (
      <button
        disabled
        style={{
          padding: compact ? '4px 6px' : '6px 10px',
          backgroundColor: '#ccc',
          color: '#666',
          border: 'none',
          borderRadius: '12px',
          fontSize: compact ? '10px' : '12px',
          cursor: 'not-allowed',
          opacity: 0.6
        }}
        title={canMakeOfficial.reason}
      >
        Make Official
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirmation(true)}
        disabled={isLoading}
        style={{
          padding: compact ? '4px 6px' : '6px 10px',
          backgroundColor: '#FF9800',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: compact ? '10px' : '12px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          fontWeight: 'bold'
        }}
      >
        {isLoading ? 'Processing...' : 'Make Official'}
      </button>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ marginTop: 0, color: '#FF9800' }}>🔵 Make Location Official</h3>
            
            <p style={{ marginBottom: '20px' }}>
              Make this location official for <strong>3 credits</strong>?
            </p>
            
            <p style={{ 
              fontSize: '14px', 
              color: '#666', 
              backgroundColor: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              marginBottom: '20px'
            }}>
              <strong>Benefits:</strong><br/>
              • Blue checkmark verification<br/>
              • 150-foot protected boundary<br/>
              • Enhanced visibility and trust
            </p>

            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowConfirmation(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ccc',
                  color: '#333',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleMakeOfficial}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1,
                  fontWeight: 'bold'
                }}
              >
                {isLoading ? 'Processing...' : 'Make Official (3 credits)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MakeOfficialButton; 