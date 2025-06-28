import React, { useState, useEffect } from 'react';
import creditService from '../services/creditService';
import CreditPurchaseModal from './CreditPurchaseModal';

const CreditBalance = ({ onBalanceUpdate }) => {
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await creditService.getBalance();
      setBalance(response.balance);
      if (onBalanceUpdate) {
        onBalanceUpdate(response.balance);
      }
    } catch (err) {
      console.error('Error fetching credit balance:', err);
      setError('Failed to load credit balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handlePurchaseSuccess = () => {
    fetchBalance(); // Refresh balance after purchase
    setShowPurchaseModal(false);
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ color: '#666' }}>Loading credits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#ffebee',
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #ffcdd2',
        color: '#c62828'
      }}>
        {error}
      </div>
    );
  }

  return (
    <>
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          color: '#FF9800', 
          marginBottom: '5px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          💰 Credits
        </h3>
        <p style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          marginBottom: '10px',
          color: '#333'
        }}>
          {balance}
        </p>
        <p style={{ 
          fontSize: '12px', 
          color: '#666',
          margin: '0 0 15px 0',
          fontStyle: 'italic'
        }}>
          Use credits to make locations official or trade location rights
        </p>
        <button
          onClick={() => setShowPurchaseModal(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#F57C00'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#FF9800'}
        >
          Buy Credits
        </button>
      </div>

      {showPurchaseModal && (
        <CreditPurchaseModal
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </>
  );
};

export default CreditBalance; 