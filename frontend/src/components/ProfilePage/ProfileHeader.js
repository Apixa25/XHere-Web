import React from 'react';
import ProfilePicture from './ProfilePicture';

const ProfileHeader = ({ userData, API_URL, navigate }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      {/* Profile Info Card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '15px 25px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        gap: '20px',
        flex: '1',
        marginRight: '20px'
      }}>
        <ProfilePicture 
          currentPicture={`${API_URL}/${userData?.profile?.pictureUrl}`}
          onUpdate={(pictureUrl) => {
            // ... existing update logic
          }}
        />
        
        <h2 style={{ 
          margin: 0, 
          fontSize: '1.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          whiteSpace: 'nowrap'
        }}>
          {userData?.profile?.name || userData?.email || 'User'}
          {userData?.isAdmin && (
            <span style={{
              backgroundColor: '#9c27b0',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}>
              Admin
            </span>
          )}
        </h2>
      </div>

      <button 
        onClick={() => navigate('/')} 
        style={{
          padding: '12px 24px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontSize: '1.1rem',
          minWidth: '150px',
          flexShrink: 0
        }}
      >
        Back to Map
      </button>
    </div>
  );
};

export default ProfileHeader; 