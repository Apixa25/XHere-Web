import React, { useState, useEffect } from 'react';
import locationTradingService from '../services/locationTradingService';

const OwnershipStatus = ({ location, compact = false, onStatusUpdate, refreshTrigger = 0 }) => {
  const [ownershipInfo, setOwnershipInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}k`;
    }
    return price.toString();
  };

  const isOwnedByCurrentUser = () => {
    return ownershipInfo?.ownerId === currentUserId;
  };

  const isOfficial = () => {
    return ownershipInfo?.isOfficial;
  };

  const getPriceTrendColor = (trend) => {
    switch (trend) {
      case 'early': return '#4CAF50';
      case 'mid': return '#FF9800';
      case 'late': return '#F44336';
      default: return '#666';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: compact ? '12px' : '14px',
        color: '#666'
      }}>
        <div style={{ fontSize: '12px' }}>🔄</div>
        Loading...
      </div>
    );
  }

  if (error || !ownershipInfo) {
    return null; // Don't show anything if there's an error
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: compact ? 'row' : 'column',
      gap: compact ? '8px' : '6px',
      alignItems: compact ? 'center' : 'flex-start'
    }}>
      {/* Official Status Badge */}
      {isOfficial() && (
        <div style={{
          backgroundColor: '#2196F3',
          color: 'white',
          padding: compact ? '2px 6px' : '4px 8px',
          borderRadius: '12px',
          fontSize: compact ? '10px' : '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>✓</span>
          <span>Official</span>
        </div>
      )}

      {/* Ownership Status */}
      <div style={{
        backgroundColor: isOwnedByCurrentUser() ? '#4CAF50' : '#FF9800',
        color: 'white',
        padding: compact ? '2px 6px' : '4px 8px',
        borderRadius: '12px',
        fontSize: compact ? '10px' : '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>{isOwnedByCurrentUser() ? '👑' : '🏪'}</span>
        <span>{isOwnedByCurrentUser() ? 'Owned' : 'For Sale'}</span>
      </div>

      {/* Price Information */}
      <div style={{
        backgroundColor: '#f0f0f0',
        color: '#333',
        padding: compact ? '2px 6px' : '4px 8px',
        borderRadius: '12px',
        fontSize: compact ? '10px' : '12px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>💰</span>
        <span>{formatPrice(ownershipInfo.currentPrice)} credits</span>
      </div>

      {/* Purchase Count */}
      {ownershipInfo.purchaseCount > 0 && (
        <div style={{
          backgroundColor: '#e8f5e8',
          color: '#2e7d32',
          padding: compact ? '2px 6px' : '4px 8px',
          borderRadius: '12px',
          fontSize: compact ? '10px' : '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>🔄</span>
          <span>{ownershipInfo.purchaseCount} sold</span>
        </div>
      )}

      {/* Price Trend (if available) */}
      {ownershipInfo.priceInfo?.priceTrend && (
        <div style={{
          backgroundColor: '#fff3e0',
          color: getPriceTrendColor(ownershipInfo.priceInfo.priceTrend.trend),
          padding: compact ? '2px 6px' : '4px 8px',
          borderRadius: '12px',
          fontSize: compact ? '10px' : '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>📈</span>
          <span style={{ textTransform: 'capitalize' }}>
            {ownershipInfo.priceInfo.priceTrend.trend}
          </span>
        </div>
      )}

      {/* Next Price (if not owned by current user) */}
      {!isOwnedByCurrentUser() && ownershipInfo.nextPrice && (
        <div style={{
          backgroundColor: '#fff3e0',
          color: '#FF9800',
          padding: compact ? '2px 6px' : '4px 8px',
          borderRadius: '12px',
          fontSize: compact ? '10px' : '12px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>⏭️</span>
          <span>Next: {formatPrice(ownershipInfo.nextPrice)}</span>
        </div>
      )}
    </div>
  );
};

export default OwnershipStatus; 