import React, { useState, useEffect } from 'react';
import ProfilePicture from './ProfilePicture';

const ProfileHeader = ({ userData, setUserData, API_URL, navigate }) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    // Update preview URL when userData changes
    if (userData?.profile?.pictureUrl) {
      setPreviewUrl(`${API_URL}/${userData.profile.pictureUrl}`);
    }
  }, [userData, API_URL]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    console.log('🖼️ File selected:', file);
    
    // Show immediate preview
    if (file) {
      const tempUrl = URL.createObjectURL(file);
      setPreviewUrl(tempUrl);
    }
    
    if (file && userData?.profile) {
      try {
        const formData = new FormData();
        formData.append('profilePicture', file);
        const token = localStorage.getItem('token');
        
        console.log('🔑 Token:', token);
        console.log('📤 Attempting upload to:', `${API_URL}/api/users/profile-picture`);
        
        const response = await fetch(`${API_URL}/api/users/profile-picture`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('📡 Response status:', response.status);
        const responseText = await response.text();
        console.log('📝 Response body:', responseText);

        if (response.ok) {
          const data = JSON.parse(responseText);
          console.log('✅ Upload successful, received data:', data);
          
          if (data.pictureUrl) {
            // Update the preview with the new server URL
            setPreviewUrl(`${API_URL}/${data.pictureUrl}`);
            
            setUserData(prev => ({
              ...prev,
              profile: {
                ...prev.profile,
                pictureUrl: data.pictureUrl
              }
            }));
          }
        }
      } catch (error) {
        // If error, revert to previous image
        setPreviewUrl(`${API_URL}/${userData?.profile?.pictureUrl}`);
        console.error('❌ Error in upload process:', error);
      }
    }
  };

  return (
    <div className="profile-header" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '20px',
    }}>
      <div className="profile-info" style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '15px 25px',
        borderRadius: '6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        gap: '25px',
        flex: '1',
        marginRight: '20px'
      }}>
        <div className="profile-picture-container" style={{ 
          position: 'relative',
          width: '80px',
          height: '80px'
        }}> 
          <img 
            src={previewUrl || `${API_URL}/${userData?.profile?.pictureUrl}`}
            alt="Profile"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '2px solid #fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <label 
            htmlFor="profile-picture-input" 
            style={{
              position: 'absolute',
              bottom: '-5px',
              right: '-5px',
              backgroundColor: '#2196F3',
              color: 'white',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              border: '2px solid white',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              zIndex: 10
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 3px 6px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            }}
          >
            ✏️
          </label>
          <input
            type="file"
            id="profile-picture-input"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        
        <h2 style={{ 
          margin: 0, 
          fontSize: '2.2rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {userData?.profile?.name || userData?.email || 'User'}
          {userData?.isAdmin && (
            <span style={{
              backgroundColor: '#9c27b0',
              color: 'white',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '1rem'
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
          flexShrink: 0,
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
        onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
        onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
      >
        Back to Map
      </button>
    </div>
  );
};

export default ProfileHeader; 