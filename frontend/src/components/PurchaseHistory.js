import React, { useState, useEffect } from 'react';
import locationTradingService from '../services/locationTradingService';

const PurchaseHistory = ({ locationId, isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && locationId) {
      fetchPurchaseHistory();
    }
  }, [isOpen, locationId]);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await locationTradingService.getPurchaseHistory(locationId);
      setHistory(response.history || []);
    } catch (err) {
      console.error('Error fetching purchase history:', err);
      setError('Failed to load purchase history');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}k credits`;
    }
    return `${price} credits`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
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
        maxWidth: '600px',
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
            📜 Purchase History
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

        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔄</div>
            Loading purchase history...
          </div>
        ) : error ? (
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
        ) : history.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#666'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>No Purchase History</div>
            <div style={{ fontSize: '14px', color: '#999' }}>
              This location hasn't been purchased yet.
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>
                  Total Transactions:
                </span>
                <span style={{ 
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {history.length}
                </span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: 'bold', color: '#333' }}>
                  Total Value Traded:
                </span>
                <span style={{ 
                  backgroundColor: '#FF9800',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  {formatPrice(history.reduce((sum, item) => sum + item.pricePaid, 0))}
                </span>
              </div>
            </div>

            {/* History List */}
            <div style={{
              maxHeight: '400px',
              overflow: 'auto'
            }}>
              {history.map((transaction, index) => {
                const currentUser = getCurrentUser();
                const isCurrentUser = currentUser?.id === transaction.buyerId;
                
                return (
                  <div
                    key={transaction.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '12px',
                      backgroundColor: isCurrentUser ? '#e8f5e8' : 'white',
                      borderLeft: isCurrentUser ? '4px solid #4CAF50' : '4px solid #FF9800'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            backgroundColor: isCurrentUser ? '#4CAF50' : '#FF9800',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            #{history.length - index}
                          </span>
                          <span style={{
                            fontWeight: 'bold',
                            color: '#333',
                            fontSize: '16px'
                          }}>
                            {transaction.buyer?.username || transaction.buyer?.email || 'Unknown User'}
                          </span>
                          {isCurrentUser && (
                            <span style={{
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              padding: '2px 6px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: 'bold'
                            }}>
                              YOU
                            </span>
                          )}
                        </div>
                        
                        <div style={{
                          color: '#666',
                          fontSize: '14px',
                          marginBottom: '8px'
                        }}>
                          Purchased on {formatDate(transaction.purchasedAt)}
                        </div>
                      </div>
                      
                      <div style={{
                        textAlign: 'right'
                      }}>
                        <div style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#4CAF50',
                          marginBottom: '4px'
                        }}>
                          {formatPrice(transaction.pricePaid)}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#666'
                        }}>
                          Transaction #{transaction.id.slice(0, 8)}
                        </div>
                      </div>
                    </div>

                    {/* Location Info */}
                    {transaction.location && (
                      <div style={{
                        backgroundColor: '#f5f5f5',
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#666',
                        fontStyle: 'italic'
                      }}>
                        "{transaction.location.content?.text || 'Location'}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Price Progression Chart */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginTop: '20px'
            }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                color: '#333'
              }}>
                📈 Price Progression
              </h3>
              <div style={{
                display: 'flex',
                gap: '8px',
                overflow: 'auto',
                padding: '8px 0'
              }}>
                {history.map((transaction, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      minWidth: '80px'
                    }}
                  >
                    <div style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      {formatPrice(transaction.pricePaid)}
                    </div>
                    <div style={{
                      fontSize: '10px',
                      color: '#666',
                      marginTop: '4px'
                    }}>
                      #{history.length - index}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Close Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '20px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseHistory; 