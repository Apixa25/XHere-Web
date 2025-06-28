import React, { useState, useEffect } from 'react';
import locationTradingService from '../services/locationTradingService';
import creditService from '../services/creditService';

const LocationPurchaseModal = ({ 
  location, 
  ownershipInfo,
  isOpen, 
  onClose, 
  onPurchaseSuccess,
  onError 
}) => {
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && location) {
      fetchUserCredits();
    }
  }, [isOpen, location]);

  const fetchUserCredits = async () => {
    try {
      const response = await creditService.getBalance();
      setUserCredits(response.balance);
    } catch (err) {
      console.error('Error fetching user credits:', err);
    }
  };

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      setError(null);
      
      const result = await locationTradingService.purchaseLocation(location.id);
      
      // Update user credits
      await fetchUserCredits();
      
      if (onPurchaseSuccess) {
        onPurchaseSuccess(result);
      }
      
      onClose();
    } catch (err) {
      console.error('Error purchasing location:', err);
      setError(err.message || 'Failed to purchase location');
      if (onError) {
        onError(err);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}k credits`;
    }
    return `${price} credits`;
  };

  const getPriceTrendColor = (trend) => {
    switch (trend) {
      case 'early': return '#4CAF50';
      case 'mid': return '#FF9800';
      case 'late': return '#F44336';
      default: return '#666';
    }
  };

  if (!isOpen) return null;

  return (
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
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '15px'
        }}>
          <h2 style={{
            margin: 0,
            color: '#333',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            🏪 Purchase Location
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* Location Info */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            color: '#333'
          }}>
            {location?.content?.text || 'Location'}
          </h3>
          <p style={{
            margin: 0,
            color: '#666',
            fontSize: '14px'
          }}>
            Location ID: {location?.id}
          </p>
        </div>

        {error ? (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2'
          }}>
            ❌ {error}
          </div>
        ) : ownershipInfo ? (
          <>
            {/* Price Information */}
            <div style={{
              backgroundColor: '#e8f5e8',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px solid #4CAF50'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px'
              }}>
                <div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    Current Price
                  </div>
                  <div style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#4CAF50'
                  }}>
                    {formatPrice(ownershipInfo.currentPrice)}
                  </div>
                </div>
                <div style={{
                  textAlign: 'right'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
                    marginBottom: '4px'
                  }}>
                    Next Price
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#FF9800'
                  }}>
                    {formatPrice(ownershipInfo.nextPrice)}
                  </div>
                </div>
              </div>

              {/* Purchase Count */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  Purchase Count:
                </span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: '#333',
                  fontSize: '16px'
                }}>
                  {ownershipInfo.purchaseCount}
                </span>
              </div>

              {/* Price Trend */}
              {ownershipInfo.priceInfo?.priceTrend && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px'
                }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    Price Trend:
                  </span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: getPriceTrendColor(ownershipInfo.priceInfo.priceTrend.trend),
                    fontSize: '14px',
                    textTransform: 'capitalize'
                  }}>
                    {ownershipInfo.priceInfo.priceTrend.trend} Stage
                  </span>
                </div>
              )}

              {/* Price Increase */}
              {ownershipInfo.priceInfo?.priceIncrease && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ color: '#666', fontSize: '14px' }}>
                    Price Increase:
                  </span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: '#F44336',
                    fontSize: '16px'
                  }}>
                    +{formatPrice(ownershipInfo.priceInfo.priceIncrease)} ({ownershipInfo.priceInfo.priceIncreasePercentage}%)
                  </span>
                </div>
              )}
            </div>

            {/* User Credits */}
            <div style={{
              backgroundColor: '#f0f8ff',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '1px solid #2196F3'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  Your Credits:
                </span>
                <span style={{ 
                  fontWeight: 'bold',
                  color: '#2196F3',
                  fontSize: '18px'
                }}>
                  {userCredits} credits
                </span>
              </div>
              
              {userCredits < ownershipInfo.currentPrice && (
                <div style={{
                  color: '#F44336',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  ⚠️ Insufficient credits. You need {formatPrice(ownershipInfo.currentPrice - userCredits)} more.
                </div>
              )}
            </div>

            {/* Official Status */}
            {ownershipInfo.isOfficial && (
              <div style={{
                backgroundColor: '#e3f2fd',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                border: '1px solid #2196F3',
                textAlign: 'center'
              }}>
                <div style={{
                  color: '#2196F3',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  ✅ Official Location
                </div>
                <div style={{
                  color: '#666',
                  fontSize: '12px'
                }}>
                  This location has been verified and is protected
                </div>
              </div>
            )}

            {/* Owner Information */}
            {ownershipInfo.owner && (
              <div style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '4px'
                }}>
                  Current Owner:
                </div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#333'
                }}>
                  {ownershipInfo.owner.profile?.name || ownershipInfo.owner.email}
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔄</div>
            Loading ownership information...
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '20px'
        }}>
          <button
            onClick={onClose}
            disabled={purchasing}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: purchasing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: purchasing ? 0.6 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={purchasing || !ownershipInfo || userCredits < ownershipInfo.currentPrice}
            style={{
              padding: '12px 24px',
              backgroundColor: userCredits >= (ownershipInfo?.currentPrice || 0) ? '#4CAF50' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (purchasing || !ownershipInfo || userCredits < (ownershipInfo?.currentPrice || 0)) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: (purchasing || !ownershipInfo || userCredits < (ownershipInfo?.currentPrice || 0)) ? 0.6 : 1
            }}
          >
            {purchasing ? (
              <>
                <span style={{ marginRight: '8px' }}>🔄</span>
                Purchasing...
              </>
            ) : (
              <>
                <span style={{ marginRight: '8px' }}>💰</span>
                Purchase for {ownershipInfo ? formatPrice(ownershipInfo.currentPrice) : '...'}
              </>
            )}
          </button>
        </div>

        {/* Warning */}
        <div style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#856404'
        }}>
          <strong>⚠️ Important:</strong> Once purchased, the location price will double for the next buyer. 
          This is a permanent transaction and cannot be undone.
        </div>
      </div>
    </div>
  );
};

export default LocationPurchaseModal; 