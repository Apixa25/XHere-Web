import React, { useState, useEffect } from 'react';
import './StatusFilter.css';

const StatusFilter = ({ onStatusChange, currentStatus = 'all' }) => {
  const [statusStats, setStatusStats] = useState({
    pending: 0,
    verified: 0,
    flagged: 0,
    removed: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Locations', icon: '🗺️', color: '#2196F3' },
    { value: 'pending', label: 'Pending', icon: '⏳', color: '#FF9800' },
    { value: 'verified', label: 'Verified', icon: '✅', color: '#4CAF50' },
    { value: 'flagged', label: 'Flagged', icon: '🚩', color: '#F44336' },
    { value: 'removed', label: 'Removed', icon: '🗑️', color: '#9E9E9E' }
  ];

  useEffect(() => {
    fetchStatusStats();
  }, []);

  const fetchStatusStats = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3000'}/api/locations/status/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatusStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching status stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (status) => {
    console.log('🔍 StatusFilter: handleStatusChange called with:', status);
    onStatusChange(status);
  };

  const getStatusCount = (status) => {
    if (status === 'all') {
      return statusStats.total;
    }
    return statusStats[status] || 0;
  };

  return (
    <div className="status-filter">
      <div className="status-filter-header">
        <h3>📍 Location Status Filter</h3>
        {isLoading && <span className="loading-spinner">🔄</span>}
      </div>
      
      <div className="status-options">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            className={`status-option ${currentStatus === option.value ? 'active' : ''}`}
            onClick={() => {
              console.log('🔍 StatusFilter: Button clicked for status:', option.value);
              handleStatusChange(option.value);
            }}
            style={{
              borderColor: currentStatus === option.value ? option.color : '#ddd',
              backgroundColor: currentStatus === option.value ? `${option.color}15` : 'white'
            }}
          >
            <span className="status-icon" style={{ color: option.color }}>
              {option.icon}
            </span>
            <span className="status-label">{option.label}</span>
            <span className="status-count">
              {getStatusCount(option.value)}
            </span>
          </button>
        ))}
      </div>

      <div className="status-summary">
        <div className="summary-item">
          <span className="summary-icon">⏳</span>
          <span className="summary-label">Pending Review:</span>
          <span className="summary-count">{statusStats.pending}</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">✅</span>
          <span className="summary-label">Verified:</span>
          <span className="summary-count">{statusStats.verified}</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">🚩</span>
          <span className="summary-label">Flagged:</span>
          <span className="summary-count">{statusStats.flagged}</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">🗑️</span>
          <span className="summary-label">Removed:</span>
          <span className="summary-count">{statusStats.removed}</span>
        </div>
      </div>
    </div>
  );
};

export default StatusFilter; 