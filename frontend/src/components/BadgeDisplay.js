import React from 'react';

const BadgeDisplay = ({ badges = [], credits = 0 }) => {
  // Parse badges if they're a string
  const parsedBadges = typeof badges === 'string' ? JSON.parse(badges) : badges;
  
  console.debug('BadgeDisplay received:', { 
    badges: parsedBadges,
    credits,
    badgeCount: parsedBadges?.length || 0
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
      marginBottom: '20px'
    }}>
      {/* Badges Card - Only show if there are badges */}
      {parsedBadges && parsedBadges.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '15px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Badges Earned</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px'
          }}>
            {parsedBadges.map((badge, index) => (
              <div key={index} style={{
                backgroundColor: '#f5f5f5',
                padding: '10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  backgroundColor: badge.color || '#4CAF50',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {badge.icon || '🏆'}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{badge.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Credits Card */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: 0 }}>Credits: {credits}</h3>
      </div>
    </div>
  );
};

export default BadgeDisplay; 