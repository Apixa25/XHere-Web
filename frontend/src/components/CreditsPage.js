import React, { useState } from 'react';
import CreditBalance from './CreditBalance';
import TransactionHistory from './TransactionHistory';

const CreditsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333', marginBottom: '30px', textAlign: 'center' }}>
        💰 Credits Management
      </h1>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'overview' ? '#FF9800' : 'transparent',
            color: activeTab === 'overview' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderBottom: activeTab === 'overview' ? '3px solid #FF9800' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'history' ? '#FF9800' : 'transparent',
            color: activeTab === 'history' ? 'white' : '#666',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            borderBottom: activeTab === 'history' ? '3px solid #FF9800' : 'none',
            transition: 'all 0.2s'
          }}
        >
          Transaction History
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div>
            <div style={{
              backgroundColor: '#f9f9f9',
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '30px'
            }}>
              <h2 style={{ color: '#333', marginBottom: '20px', textAlign: 'center' }}>
                Credit System Overview
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ color: '#FF9800', marginBottom: '15px' }}>💰 What are Credits?</h3>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Credits are the currency of XHere. Use them to make your locations "official" 
                    with a blue checkmark, or buy and sell location rights from other users.
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ color: '#4CAF50', marginBottom: '15px' }}>✅ Official Locations</h3>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Make any location official for a fee. Official locations get a blue checkmark 
                    and are protected by a 150-foot geofence to prevent spam.
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h3 style={{ color: '#2196F3', marginBottom: '15px' }}>🔄 Location Trading</h3>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>
                    Buy and sell location rights using credits. Prices escalate based on demand, 
                    creating a dynamic marketplace for valuable locations.
                  </p>
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center'
            }}>
              <CreditBalance />
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <TransactionHistory />
        )}
      </div>
    </div>
  );
};

export default CreditsPage; 