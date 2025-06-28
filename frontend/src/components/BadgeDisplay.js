import React from 'react';

const BadgeDisplay = ({ badges = [] }) => {
  // Parse badges if they're a string
  const parsedBadges = typeof badges === 'string' ? JSON.parse(badges) : badges;
  
  console.debug('BadgeDisplay received:', { 
    badges: parsedBadges,
    badgeCount: parsedBadges?.length || 0
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(1, 1fr)',
      gap: '15px',
      marginBottom: '15px'
    }}>
      {/* Badges Card - Only show if there are badges */}
      {parsedBadges && parsedBadges.length > 0 && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            marginBottom: '12px',
            fontSize: '1.1rem'
          }}>
            Badges Earned
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px'
          }}>
            {parsedBadges.map((badge, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  backgroundColor: badge.color || '#4CAF50',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}>
                  {badge.icon || '🏆'}
                </div>
                <div>
                  <div style={{ 
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {badge.name}
                  </div>
                  <div style={{ 
                    fontSize: '11px',
                    color: '#666'
                  }}>
                    {badge.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeDisplay; 