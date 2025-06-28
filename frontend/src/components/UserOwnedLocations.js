import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import locationTradingService from '../services/locationTradingService';
import creditService from '../services/creditService';
import LocationCard from './shared/LocationCard';
import CreditBalance from './CreditBalance';
import MakeOfficialButton from './MakeOfficialButton';

const UserOwnedLocations = () => {
  const [ownedLocations, setOwnedLocations] = useState([]);
  const [userCredits, setUserCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalLocations: 0,
    totalValue: 0,
    officialLocations: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchOwnedLocations();
    fetchUserCredits();
  }, []);

  const fetchOwnedLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await locationTradingService.getUserOwnedLocations();
      setOwnedLocations(response.ownedLocations || []);
      
      // Calculate stats
      const totalValue = response.ownedLocations?.reduce((sum, loc) => sum + (loc.currentPrice || 0), 0) || 0;
      const officialCount = response.ownedLocations?.filter(loc => loc.isOfficial).length || 0;
      
      setStats({
        totalLocations: response.ownedLocations?.length || 0,
        totalValue,
        officialLocations: officialCount
      });
    } catch (err) {
      console.error('Error fetching owned locations:', err);
      setError('Failed to load owned locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async () => {
    try {
      const response = await creditService.getBalance();
      setUserCredits(response.balance);
    } catch (err) {
      console.error('Error fetching user credits:', err);
    }
  };

  const handleMakeOfficial = async (locationId) => {
    try {
      await locationTradingService.makeLocationOfficial(locationId);
      // Refresh the list
      await fetchOwnedLocations();
      await fetchUserCredits();
    } catch (err) {
      console.error('Error making location official:', err);
      alert('Failed to make location official: ' + err.message);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}k credits`;
    }
    return `${price} credits`;
  };

  const handlePurchaseSuccess = (result) => {
    console.log('Location purchased successfully:', result);
    // Refresh the list to show updated ownership
    fetchOwnedLocations();
    fetchUserCredits();
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#666'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
        Loading your owned locations...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#c62828',
        backgroundColor: '#ffebee',
        borderRadius: '8px',
        border: '1px solid #ffcdd2'
      }}>
        ❌ {error}
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{
          fontSize: '32px',
          color: '#333',
          marginBottom: '10px'
        }}>
          👑 My Owned Locations
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          marginBottom: '20px'
        }}>
          Manage your location portfolio and trading activities
        </p>
        
        {/* Back to Map Button */}
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
        >
          🗺️ Back to Map
        </button>
      </div>

      {/* Stats and Credit Balance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Credit Balance */}
        <div>
          <CreditBalance onBalanceUpdate={setUserCredits} />
        </div>

        {/* Stats Cards */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            color: '#4CAF50',
            marginBottom: '15px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            📊 Portfolio Stats
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#666' }}>Total Locations:</span>
              <span style={{ 
                fontWeight: 'bold',
                color: '#333',
                fontSize: '18px'
              }}>
                {stats.totalLocations}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#666' }}>Portfolio Value:</span>
              <span style={{ 
                fontWeight: 'bold',
                color: '#4CAF50',
                fontSize: '18px'
              }}>
                {formatPrice(stats.totalValue)}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#666' }}>Official Locations:</span>
              <span style={{ 
                fontWeight: 'bold',
                color: '#2196F3',
                fontSize: '18px'
              }}>
                {stats.officialLocations}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{
            color: '#FF9800',
            marginBottom: '15px',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            ⚡ Quick Actions
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <button
              onClick={() => navigate('/credits')}
              style={{
                padding: '10px 16px',
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#F57C00'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#FF9800'}
            >
              💰 Buy More Credits
            </button>
            <button
              onClick={() => navigate('/locations')}
              style={{
                padding: '10px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#1976D2'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#2196F3'}
            >
              🏪 Browse Locations
            </button>
          </div>
        </div>
      </div>

      {/* Owned Locations */}
      {ownedLocations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏪</div>
          <h2 style={{
            fontSize: '24px',
            color: '#333',
            marginBottom: '10px'
          }}>
            No Owned Locations Yet
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '20px'
          }}>
            Start building your location portfolio by purchasing locations from the marketplace!
          </p>
          <button
            onClick={() => navigate('/locations')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            🏪 Browse Locations
          </button>
        </div>
      ) : (
        <>
          <h2 style={{
            fontSize: '24px',
            color: '#333',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Your Location Portfolio ({ownedLocations.length})
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(275px, 1fr))',
            gap: '20px',
            justifyContent: 'center'
          }}>
            {ownedLocations.map((ownedLocation) => {
              const location = ownedLocation.location;
              if (!location) return null;

              return (
                <div key={ownedLocation.id} style={{ position: 'relative' }}>
                  <LocationCard
                    location={location}
                    onPurchaseSuccess={handlePurchaseSuccess}
                    compact={false}
                  />
                  
                  {/* Owner Actions */}
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {/* Current Price Display */}
                    <div style={{
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}>
                      💰 {formatPrice(ownedLocation.currentPrice)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default UserOwnedLocations; 