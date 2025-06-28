import React, { useState, useEffect } from 'react';
import creditService from '../services/creditService';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [stats, setStats] = useState(null);
  const limit = 20;

  const fetchTransactions = async (page = 1, type = '') => {
    try {
      setLoading(true);
      setError(null);
      
      const offset = (page - 1) * limit;
      const options = { limit, offset };
      if (type) options.type = type;
      
      const response = await creditService.getTransactions(options);
      const newTransactions = response.transactions;
      
      if (page === 1) {
        setTransactions(newTransactions);
      } else {
        setTransactions(prev => [...prev, ...newTransactions]);
      }
      
      setHasMore(newTransactions.length === limit);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await creditService.getStats();
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    fetchTransactions(1, filterType);
    fetchStats();
  }, [filterType]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchTransactions(currentPage + 1, filterType);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'purchase': return '💰';
      case 'spend': return '💸';
      case 'refund': return '↩️';
      case 'bonus': return '🎁';
      case 'transfer': return '🔄';
      default: return '📝';
    }
  };

  const getTransactionColor = (type, amount) => {
    if (amount > 0) return '#4CAF50';
    if (amount < 0) return '#f44336';
    return '#666';
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'purchase': return 'Purchase';
      case 'spend': return 'Spent';
      case 'refund': return 'Refund';
      case 'bonus': return 'Bonus';
      case 'transfer': return 'Transfer';
      default: return type;
    }
  };

  if (error) {
    return (
      <div style={{
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: '20px',
        borderRadius: '8px',
        textAlign: 'center'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#333', marginBottom: '20px' }}>Transaction History</h2>
      
      {/* Stats Summary */}
      {stats && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#333' }}>Summary</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>
                {stats.totalCreditsPurchased}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Purchased</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
                {stats.totalCreditsSpent}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Spent</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FF9800' }}>
                ${(stats.totalAmountSpent / 100).toFixed(2)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Total Spent ($)</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '8px', 
          fontWeight: 'bold',
          color: '#333'
        }}>
          Filter by Type:
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          <option value="">All Transactions</option>
          <option value="purchase">Purchases</option>
          <option value="spend">Spent</option>
          <option value="refund">Refunds</option>
          <option value="bonus">Bonuses</option>
          <option value="transfer">Transfers</option>
        </select>
      </div>

      {/* Transactions List */}
      <div style={{ marginBottom: '20px' }}>
        {transactions.length === 0 && !loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            No transactions found
          </div>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
                border: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '24px' }}>
                  {getTransactionIcon(transaction.transactionType)}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {getTransactionTypeLabel(transaction.transactionType)}
                  </div>
                  {transaction.description && (
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '2px' }}>
                      {transaction.description}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                    {formatDate(transaction.createdAt)}
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: getTransactionColor(transaction.transactionType, transaction.amount)
              }}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount} Credits
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={loadMore}
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px'
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {loading && transactions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          Loading transactions...
        </div>
      )}
    </div>
  );
};

export default TransactionHistory; 