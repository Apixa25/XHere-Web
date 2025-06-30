import React, { useState } from 'react';
import api from '../services/api';

const PlaceCreditsButton = ({ location, user, onSuccess, compact = false, onLocationUpdate, onCreditsPlaced }) => {
  const [showModal, setShowModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlaceCredits = async () => {
    if (!user || !location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/credits/place`, {
        locationId: location.id,
        amount: creditAmount,
        description: `Placed ${creditAmount} credits on location: ${location.content.text}`
      });
      
      if (response.success) {
        setShowModal(false);
        if (onSuccess) {
          onSuccess(response);
        }
        if (onLocationUpdate) {
          onLocationUpdate();
        }
        if (onCreditsPlaced) {
          onCreditsPlaced(creditAmount);
        }
        alert(`✅ Successfully placed ${creditAmount} credits on this location!`);
      }
    } catch (err) {
      console.error('Error placing credits:', err);
      setError(err.message || 'Failed to place credits');
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: compact ? '8px 12px' : '10px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: compact ? '12px' : '14px',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      justifyContent: 'center',
      minWidth: compact ? 'auto' : '120px',
      backgroundColor: '#9C27B0',
      color: 'white'
    };

    if (loading) {
      return {
        ...baseStyle,
        backgroundColor: '#f5f5f5',
        color: '#666',
        cursor: 'not-allowed'
      };
    }

    return baseStyle;
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading || !user}
        className="place-credits-btn"
        style={{
          backgroundColor: '#9C27B0',
          color: 'white',
          padding: '10px 15px',
          border: 'none',
          borderRadius: '5px',
          cursor: loading || !user ? 'not-allowed' : 'pointer',
          fontSize: '1.2em',
          fontWeight: 'bold',
          minWidth: 'unset',
          width: '75%',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'background-color 0.3s ease',
          opacity: loading || !user ? 0.6 : 1
        }}
        onMouseOver={(e) => {
          if (!loading && user) {
            e.target.style.backgroundColor = '#7B1FA2';
          }
        }}
        onMouseOut={(e) => {
          if (!loading && user) {
            e.target.style.backgroundColor = '#9C27B0';
          }
        }}
        title="Place credits on this location"
      >
        <span>💰</span>
        <span>{compact ? 'Place' : 'Place Credits'}</span>
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            pointerEvents: 'all',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90vw',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              💰 Place Credits on Location
            </h3>
            
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Place credits on this location if you think it will become popular or verified. 
              You'll earn rewards if the location gets positive ratings!
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Credit Amount:
              </label>
              <input
                type="number"
                min="1"
                max={user?.credits || 100}
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
              <small style={{ color: '#666' }}>
                Your balance: {user?.credits || 0} credits
              </small>
            </div>

            {error && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handlePlaceCredits}
                disabled={loading || creditAmount > (user?.credits || 0)}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: loading ? '#ccc' : '#9C27B0',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Placing...' : `Place ${creditAmount} Credits`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaceCreditsButton; 