import React, { useState, useEffect } from 'react';
import './StatusNotification.css';

const StatusNotification = ({ statusUpdate, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (statusUpdate) {
      setIsVisible(true);
      
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300); // Wait for animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [statusUpdate, onClose]);

  if (!statusUpdate || !isVisible) return null;

  const statusConfig = {
    pending: { color: '#FF9800', icon: '⏳', bgColor: '#FFF3E0' },
    verified: { color: '#4CAF50', icon: '✅', bgColor: '#E8F5E8' },
    flagged: { color: '#F44336', icon: '🚩', bgColor: '#FFEBEE' },
    removed: { color: '#9E9E9E', icon: '🗑️', bgColor: '#F5F5F5' }
  };

  const config = statusConfig[statusUpdate.newStatus] || statusConfig.pending;

  return (
    <div className={`status-notification ${isVisible ? 'visible' : ''}`}>
      <div 
        className="status-notification-content"
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.color
        }}
      >
        <div className="status-notification-icon" style={{ color: config.color }}>
          {config.icon}
        </div>
        <div className="status-notification-text">
          <div className="status-notification-title">
            Status Updated: {statusUpdate.newStatus}
          </div>
          <div className="status-notification-reason">
            {statusUpdate.reason}
          </div>
        </div>
        <button 
          className="status-notification-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose(), 300);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default StatusNotification; 