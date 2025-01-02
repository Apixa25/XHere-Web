import React from 'react';

const BadgeNotification = ({ badges, onClose }) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxWidth: '300px'
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        🎉 New Badge{badges.length > 1 ? 's' : ''} Earned!
      </div>
      {badges.map((badge, index) => (
        <div key={index} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '5px'
        }}>
          <span style={{
            backgroundColor: badge.color,
            color: 'white',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '12px'
          }}>
            {badge.name}
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}>
            {badge.description}
          </span>
        </div>
      ))}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default BadgeNotification; 