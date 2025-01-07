import React from 'react';

const BadgeDisplay = ({ badges, credits = 0 }) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginBottom: '20px'
    }}>
      {/* Badges Card */}
      <div className="badge-container" style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '15px' }}>Badges Earned</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '15px'
        }}>
          {badges.map((badge, index) => (
            <div key={index} style={{
              backgroundColor: '#f5f5f5',
              padding: '10px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                backgroundColor: '#4CAF50',
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

      {/* XHere Credits Card */}
      <div className="credits-container" style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '15px' }}>XHere Credits</h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: '#4CAF50'
            }}>
              {credits}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginTop: '5px'
            }}>
              Available Credits
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeDisplay; 