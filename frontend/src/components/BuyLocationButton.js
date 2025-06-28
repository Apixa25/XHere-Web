import React, { useState, useEffect } from 'react';
import locationTradingService from '../services/locationTradingService';
import LocationPurchaseModal from './LocationPurchaseModal';

const BuyLocationButton = ({ location, onPurchaseSuccess, onError, compact = false, refreshTrigger = 0 }) => {
  const [ownershipInfo, setOwnershipInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Get current user id safely
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))?.id;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (location?.id) {
      fetchOwnershipInfo();
    }
  }, [location?.id, refreshTrigger]);

  const fetchOwnershipInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await locationTradingService.getLocationOwnership(location.id);
      setOwnershipInfo(response.ownership);
    } catch (err) {
      console.error('Error fetching ownership info:', err);
      setError('Failed to load ownership information');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSuccess = (result) => {
    console.log('💰 Purchase successful, refreshing ownership info...');
    if (onPurchaseSuccess) {
      onPurchaseSuccess(result);
    }
    // Refresh ownership info after purchase
    fetchOwnershipInfo();
  };

  const handleError = (err) => {
    if (onError) {
      onError(err);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}k`;
    }
    return price.toString();
  };

  const isOwnedByCurrentUser = () => {
    return ownershipInfo?.ownerId === currentUserId;
  };

  const canPurchase = () => {
    return ownershipInfo && !isOwnedByCurrentUser() && !loading && !error;
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
      minWidth: compact ? 'auto' : '120px'
    };

    if (loading) {
      return {
        ...baseStyle,
        backgroundColor: '#f5f5f5',
        color: '#666',
        cursor: 'not-allowed'
      };
    }

    if (error || !ownershipInfo) {
      return {
        ...baseStyle,
        backgroundColor: '#f5f5f5',
        color: '#666',
        cursor: 'not-allowed'
      };
    }

    if (isOwnedByCurrentUser()) {
      return {
        ...baseStyle,
        backgroundColor: '#4CAF50',
        color: 'white',
        cursor: 'default'
      };
    }

    return {
      ...baseStyle,
      backgroundColor: '#FF9800',
      color: 'white',
      ':hover': {
        backgroundColor: '#F57C00'
      }
    };
  };

  const getButtonText = () => {
    if (loading) {
      return (
        <>
          <span>🔄</span>
          <span>Loading...</span>
        </>
      );
    }

    if (error || !ownershipInfo) {
      return (
        <>
          <span>❌</span>
          <span>Error</span>
        </>
      );
    }

    if (isOwnedByCurrentUser()) {
      return (
        <>
          <span>👑</span>
          <span>Owned</span>
        </>
      );
    }

    return (
      <>
        <span>💰</span>
        <span>Buy {formatPrice(ownershipInfo.currentPrice)}</span>
      </>
    );
  };

  const handleClick = () => {
    if (canPurchase()) {
      setShowPurchaseModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={!canPurchase()}
        style={getButtonStyle()}
        onMouseOver={(e) => {
          if (canPurchase() && !isOwnedByCurrentUser()) {
            e.target.style.backgroundColor = '#F57C00';
          }
        }}
        onMouseOut={(e) => {
          if (canPurchase() && !isOwnedByCurrentUser()) {
            e.target.style.backgroundColor = '#FF9800';
          }
        }}
      >
        {getButtonText()}
      </button>

      {/* Price Tooltip for compact mode */}
      {compact && ownershipInfo && !isOwnedByCurrentUser() && (
        <div style={{
          position: 'absolute',
          top: '-30px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '10px',
          whiteSpace: 'nowrap',
          opacity: 0,
          transition: 'opacity 0.2s',
          pointerEvents: 'none',
          zIndex: 10
        }}
        onMouseEnter={(e) => e.target.style.opacity = 1}
        onMouseLeave={(e) => e.target.style.opacity = 0}
        >
          {formatPrice(ownershipInfo.currentPrice)} credits
        </div>
      )}

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <LocationPurchaseModal
          location={location}
          ownershipInfo={ownershipInfo}
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          onPurchaseSuccess={handlePurchaseSuccess}
          onError={handleError}
        />
      )}
    </>
  );
};

export default BuyLocationButton; 