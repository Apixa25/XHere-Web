import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import LocationDetails from './LocationDetails';
import api from '../services/api';
import BadgeDisplay from './BadgeDisplay';
import ProfileHeader from './ProfilePage/ProfileHeader';
import ProfilePicture from './ProfilePage/ProfilePicture';
import MessagingPage from './messaging/MessagingPage';
import MessageButton from './messaging/MessageButton';
import messageService from '../services/messageService';
import MessagingPanel from './messaging/MessagingPanel';
import KeywordsDisplay from '../components/KeywordsDisplay';
import LOCATION_TYPES from '../constants/locationTypes';
import CreditBalance from './CreditBalance';
import CreditsPage from './CreditsPage';
import ReputationDashboard from './ReputationDashboard';
import DownvoteDashboard from './DownvoteDashboard';
import TrustBasedPostingInfo from './TrustBasedPostingInfo';

const AdminBadge = () => (
  <div style={{
    backgroundColor: '#9C27B0',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '16px',
    fontSize: '24px',
    display: 'inline-block',
    marginLeft: '12px',
    fontWeight: 'bold'
  }}>
    Admin
  </div>
);

const ProfilePage = ({ user, onLocationUpdate, isRegistering, handleAuth }) => {
  const [userData, setUserData] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editForm, setEditForm] = useState({ text: '', newMedia: [] });
  const [mediaToDelete, setMediaToDelete] = useState([]);
  const [showMessaging, setShowMessaging] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('token');

  const fetchUserData = async () => {
    try {
      const response = await api.getUserProfile(user.id);
      console.log('User profile response:', response);
      
      // Make sure we're getting badges from the response
      const userBadges = response.user.badges || [];
      console.log('Fetched badges:', userBadges);
      
      setUserData({
        ...response.user,
        isAdmin: user.isAdmin,
        name: response.user.profile?.name || response.user.email,
        profile: response.user.profile || {},
        badges: userBadges // Make sure badges are included in userData
      });
      
      // Fetch unread message count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Function to fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      const { count } = await messageService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchUserLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('Fetching with token:', token);
      
      const response = await fetch(`${API_URL}/api/locations?profile=true`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      console.log('Raw location data:', JSON.stringify(data[0], null, 2));
      console.log('Fetched locations:', data);
      
      const transformedData = data.map(location => ({
        ...location,
        _id: location.id,
        creator: location.creator ? {
          _id: location.creator.id,
          email: location.creator.email,
          profile: location.creator.profile
        } : null,
        content: {
          ...location.content,
          mediaTypes: location.content?.mediaTypes || [],
          mediaUrls: location.content?.mediaUrls || [],
          text: location.content?.text || ''
        }
      }));
      
      setUserLocations(transformedData);
      const totalPoints = calculateTotalPoints(transformedData);
      setUserData(prevData => ({
        ...prevData,
        points: totalPoints
      }));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user locations:', error);
      setError('Failed to fetch locations');
      setLoading(false);
    }
  };

  const calculateTotalPoints = (locations) => {
    return locations.reduce((total, location) => {
      return total + (location.upvotes - location.downvotes);
    }, 0);
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }

      // Remove the deleted location from state
      setUserLocations(prevLocations => 
        prevLocations.filter(loc => loc.id !== locationId)
      );

      // Notify parent component to update locations
      if (onLocationUpdate) {
        onLocationUpdate();
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location');
    }
  };

  useEffect(() => {
    if (user) {
      setUserData({ ...user });
      fetchUserData();
      fetchUserLocations();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('Current user object:', user);
    console.log('Is admin?:', user?.isAdmin);
  }, [user]);

  useEffect(() => {
    console.log('Full user object:', user);
    console.log('User admin status:', user?.isAdmin);
    console.log('User profile:', user?.profile);
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        console.error('No token available');
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Profile fetch failed: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Received non-JSON response from server');
        }

        const data = await response.json();
        console.log('Profile data received:', data);
        
        setUserData({
          ...data.user,
          isAdmin: user.isAdmin,
          name: data.user.profile?.name || data.user.email,
          profile: data.user.profile || {},
          badges: data.user.badges || []
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token, user]);

  const handleDelete = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        console.log('Attempting to delete location:', locationId);
        console.log('User ID:', user._id);
        const token = localStorage.getItem('token');
        
        const response = await fetch(`http://localhost:3000/api/locations/${locationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Delete response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete location');
        }

        setUserLocations(userLocations.filter(loc => loc._id !== locationId));
        onLocationUpdate();
      } catch (err) {
        console.error('Delete error:', err);
        setError(err.message);
      }
    }
  };

  const handleEdit = (location) => {
    console.log('Edit clicked for location:', location._id);
    console.log('Current user:', user);
    console.log('Location creator:', location.creator);
    setEditingLocation(location);
    setEditForm({
      text: location.content.text,
      newMedia: [],
      mediaUrls: location.content.mediaUrls || [],
      mediaTypes: location.content.mediaTypes || []
    });
    setMediaToDelete([]);
  };

  const handleMediaCheckbox = (index) => {
    setMediaToDelete(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleUpdate = async (locationId) => {
    try {
      console.log('Attempting to update location:', locationId);
      const token = localStorage.getItem('token');
      
      // Find the existing location to preserve coordinates
      const location = userLocations.find(loc => loc._id === locationId);
      const formData = new FormData();
      formData.append('text', editForm.text);
      
      // Preserve location coordinates
      if (location?.location?.coordinates) {
        formData.append('longitude', location.location.coordinates[0]);
        formData.append('latitude', location.location.coordinates[1]);
      }
      
      if (editForm.newMedia?.length > 0) {
        editForm.newMedia.forEach(file => {
          formData.append('media', file);
        });
      }
      
      if (mediaToDelete.length > 0) {
        formData.append('deleteMediaIndexes', JSON.stringify(mediaToDelete));
      }

      const response = await fetch(`${API_URL}/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update location');
      }

      const updatedLocation = await response.json();
      
      const transformedLocation = {
        ...updatedLocation,
        _id: updatedLocation.id,
        creator: updatedLocation.creator ? {
          _id: updatedLocation.creator.id,
          email: updatedLocation.creator.email,
          profile: updatedLocation.creator.profile
        } : null
      };

      setUserLocations(prevLocations => 
        prevLocations.map(loc => 
          loc._id === locationId ? transformedLocation : loc
        )
      );
      
      setEditingLocation(null);
      setMediaToDelete([]);
      if (onLocationUpdate) {
        onLocationUpdate();
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
    }
  };

  const handleDeleteMedia = async (locationId, mediaIndex) => {
    console.log('Attempting to delete media at index:', mediaIndex);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/locations/${locationId}/media/${mediaIndex}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      // Update the locations state to reflect the deleted media
      setUserLocations(prevLocations => {
        return prevLocations.map(location => {
          if (location.id === locationId) {
            const updatedMediaUrls = location.content.mediaUrls.filter((_, index) => index !== mediaIndex);
            const updatedMediaTypes = location.content.mediaTypes.filter((_, index) => index !== mediaIndex);
            
            return {
              ...location,
              content: {
                ...location.content,
                mediaUrls: updatedMediaUrls,
                mediaTypes: updatedMediaTypes
              }
            };
          }
          return location;
        });
      });

      // If we're currently editing this location, update the editingLocation state as well
      setEditingLocation(prev => {
        if (prev && prev._id === locationId) {
          const updatedMediaUrls = prev.content.mediaUrls.filter((_, index) => index !== mediaIndex);
          const updatedMediaTypes = prev.content.mediaTypes.filter((_, index) => index !== mediaIndex);
          
          return {
            ...prev,
            content: {
              ...prev.content,
              mediaUrls: updatedMediaUrls,
              mediaTypes: updatedMediaTypes
            }
          };
        }
        return prev;
      });

    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      
      const response = await fetch('http://localhost:3000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
          email: decoded.email,
          name: decoded.name
        })
      });

      if (!response.ok) {
        throw new Error('Google authentication failed');
      }

      const data = await response.json();
      console.log('Login response:', data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.location.reload();
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to login with Google');
    }
  };

  const renderAuthForm = () => (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleAuth}>
        {/* ... existing form fields ... */}
      </form>
      
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>Or continue with:</p>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            console.log('Google Login Failed');
          }}
        />
      </div>
    </div>
  );

  const getStatusBadge = (location) => {
    switch(location.verificationStatus) {
      case 'verified':
        return (
          <div style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'inline-block',
            marginLeft: '8px'
          }}>
            ✓ Verified
          </div>
        );
      case 'pending':
        return (
          <div style={{
            backgroundColor: '#FFA726',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'inline-block',
            marginLeft: '8px'
          }}>
            ⏳ Pending Verification
          </div>
        );
      default:
        return null;
    }
  };

  const LocationCard = ({ location }) => {
    console.log("LocationCard props:", location);
    
    // Debug log for MessageButton logic
    console.log("DEBUG ProfilePage LocationCard:", {
      creatorId: location.creator?.id,
      userDataId: userData?.id,
      shouldShowMessage: location.creator?.id !== userData?.id
    });
    
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '15px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px'
        }}>
          <div>
            <p style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              marginBottom: '4px',
              marginTop: 0
            }}>
              Location Details
            </p>
            <p style={{ 
              fontSize: '14px',
              margin: '0 0 8px 0' 
            }}>
              {location.content.text}
            </p>
            {location.locationType && LOCATION_TYPES[location.locationType] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.95em', color: '#1976d2', fontWeight: 500 }}>
                <span>{LOCATION_TYPES[location.locationType].icon}</span>
                <span>{LOCATION_TYPES[location.locationType].label}</span>
              </div>
            )}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '4px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {location.totalPoints !== undefined ? location.totalPoints : 0} pts
              </div>
              {location.credits > 0 && (
                <div style={{
                  backgroundColor: '#FF9800',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  💰 {location.credits} Credits
                </div>
              )}
              {getStatusBadge(location)}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '14px', color: '#666' }}>
            👍 {location.upvotes || 0}
          </span>
          <span style={{ fontSize: '14px', color: '#666' }}>
            👎 {location.downvotes || 0}
          </span>
        </div>

        {location.content.mediaUrls && location.content.mediaUrls.length > 0 && (
          <div style={{ marginTop: '10px' }}>
            {location.content.mediaUrls.map((url, index) => {
              const mediaType = location.content.mediaTypes[index];
              if (mediaType?.startsWith('video/')) {
                return (
                  <video
                    key={index}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      marginBottom: '10px'
                    }}
                  >
                    <source src={`${API_URL}/${url}`} type={mediaType} />
                    Your browser does not support the video tag.
                  </video>
                );
              } else {
                return (
                  <img
                    key={index}
                    src={`${API_URL}/${url}`}
                    alt="Location media"
                    style={{
                      width: '100%',
                      maxHeight: '200px',
                      objectFit: 'cover',
                      marginBottom: '10px',
                      borderRadius: '4px'
                    }}
                  />
                );
              }
            })}
          </div>
        )}

        {/* Always show creator info */}
        <div style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginBottom: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Created by: {location.creator.profile?.name || location.creator.email}</span>
          {/* Only show MessageButton if not user's own card */}
          {(() => {
            const creatorId = location.creator?.id || location.creatorId;
            return creatorId !== userData?.id;
          })() && (
            <MessageButton
              recipientId={location.creator?.id || location.creatorId}
              recipientName={location.creator?.profile?.name || location.creator?.email}
              locationId={location.id}
              locationText={location.content.text}
              className="small"
              onMessageSent={() => {
                // Could show a success message here
                console.log('Message sent successfully');
              }}
            >
              💬
            </MessageButton>
          )}
        </div>
      </div>
    );
  };

  const renderLocationMedia = (location) => {
    return location.content?.mediaUrls?.map((url, index) => {
      const mediaType = location.content?.mediaTypes?.[index] || 'image/jpeg';
      
      if (mediaType?.startsWith('video/')) {
        return (
          <video
            key={index}
            controls
            style={{
              width: '100%',
              maxHeight: '200px',
              marginBottom: '10px'
            }}
          >
            <source src={`${API_URL}/${url}`} type={mediaType} />
            Your browser does not support the video tag.
          </video>
        );
      } else {
        return (
          <img 
            key={index}
            src={`${API_URL}/${url}`}
            alt={`Location media ${index + 1}`}
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'cover',
              marginBottom: '10px',
              borderRadius: '4px'
            }}
            onError={(e) => console.error('Image failed to load:', url)}
          />
        );
      }
    });
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Error: {error}</p>
        <button 
          onClick={fetchUserLocations}
          style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div>Loading...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Fetching your locations...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <ProfileHeader 
        userData={userData}
        setUserData={setUserData}
        API_URL={API_URL}
        navigate={navigate}
      />

      {/* Messages and Credits Buttons */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => {
            console.log('📬 Messages button clicked!');
            console.log('📬 Current unread count:', unreadCount);
            console.log('📬 MessagingPage component:', typeof MessagingPage);
            setShowMessaging(true);
          }}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
            transition: 'all 0.2s ease',
            position: 'relative'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(33, 150, 243, 0.3)';
          }}
        >
          💬 Messages
          {unreadCount > 0 && (
            <span style={{
              background: '#f44336',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              marginLeft: '4px'
            }}>
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => navigate('/credits')}
          style={{
            background: '#FF9800',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(255, 152, 0, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(255, 152, 0, 0.3)';
          }}
        >
          💰 Manage Credits
        </button>
      </div>

      <BadgeDisplay 
        badges={userData?.badges || []} 
        credits={userData?.credits || 0} 
      />

      {/* Reputation Dashboard */}
      <div style={{ marginBottom: '30px' }}>
        <ReputationDashboard />
      </div>

      {/* Downvote Dashboard */}
      {userData?.id && (
        <div style={{ marginBottom: '30px' }}>
          <DownvoteDashboard userId={userData.id} />
        </div>
      )}

      {/* Trust-Based Posting Info */}
      <div style={{ marginBottom: '30px' }}>
        <TrustBasedPostingInfo userData={userData} />
      </div>

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <div className="user-stats" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <CreditBalance onBalanceUpdate={(newBalance) => {
            setUserData(prevData => ({
              ...prevData,
              credits: newBalance
            }));
          }} />
          <div className="stat-card" style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#2196F3', marginBottom: '5px' }}>Points</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{userData?.points || 0}</p>
            <p style={{ 
              fontSize: '12px', 
              color: '#666',
              margin: '0',
              fontStyle: 'italic'
            }}>
              Total upvotes minus downvotes across all your locations
            </p>
          </div>
          <div className="stat-card" style={{
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#4CAF50', marginBottom: '5px' }}>Reputation</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{userData?.reputation || 0}</p>
            <p style={{ 
              fontSize: '12px', 
              color: '#666',
              margin: '0',
              fontStyle: 'italic'
            }}>
              Earned by having your locations verified as accurate
            </p>
          </div>
        </div>
      </div>

      <h3>{userData?.isAdmin ? 'All Locations' : 'Your Locations'}</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(315px, 1fr))',
          gap: '40px',
          justifyContent: 'center',
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {userLocations.map(location => (
            <div
              key={location.id}
              style={{
                width: '275px',
                minHeight: '275px',
                maxHeight: editingLocation?._id === location._id ? 'none' : '275px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'visible',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                margin: '0 auto',
                position: 'relative',
                marginBottom: '20px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '8px',
                gap: '8px'
              }}>
                <div style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {location.upvotes - location.downvotes} pts
                </div>
                {location.credits > 0 && (
                  <div style={{
                    backgroundColor: '#FF9800',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    💰 {location.credits} Credits
                  </div>
                )}
              </div>

              {/* Always show creator info */}
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Created by: {location.creator.profile?.name || location.creator.email}</span>
                {/* Only show MessageButton if not user's own card */}
                {(() => {
                  const creatorId = location.creator?.id || location.creatorId;
                  return creatorId !== userData?.id;
                })() && (
                  <MessageButton
                    recipientId={location.creator?.id || location.creatorId}
                    recipientName={location.creator?.profile?.name || location.creator?.email}
                    locationId={location.id}
                    locationText={location.content.text}
                    className="small"
                    onMessageSent={() => {
                      // Could show a success message here
                      console.log('Message sent successfully');
                    }}
                  >
                    💬
                  </MessageButton>
                )}
              </div>
              
              {editingLocation?._id === location._id ? (
                // Edit mode
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '10px',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  padding: '15px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  zIndex: 1
                }}>
                  <textarea
                    value={editForm.text}
                    onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                    style={{
                      flex: '1',
                      marginBottom: '10px',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      resize: 'none'
                    }}
                  />
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ marginBottom: '10px', maxHeight: '100px', overflow: 'auto' }}>
                      {location.content.mediaUrls?.map((url, index) => (
                        <div key={index} style={{ 
                          marginBottom: '5px', 
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <div style={{ 
                            width: '60px', 
                            height: '60px', 
                            position: 'relative',
                            opacity: mediaToDelete.includes(index) ? '0.5' : '1'
                          }}>
                            {location.content.mediaTypes[index].startsWith('video/') ? (
                              <video style={{ width: '100%', height: '100%', objectFit: 'cover' }}>
                                <source src={`${API_URL}/${url}`} type={location.content.mediaTypes[index]} />
                              </video>
                            ) : (
                              <img
                                src={`${API_URL}/${url}`}
                                alt={`Media ${index + 1}`}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            )}
                          </div>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            cursor: 'pointer'
                          }}>
                            <input
                              type="checkbox"
                              checked={mediaToDelete.includes(index)}
                              onChange={() => handleMediaCheckbox(index)}
                              style={{ cursor: 'pointer' }}
                            />
                            Delete
                          </label>
                        </div>
                      ))}
                    </div>
                    {mediaToDelete.length > 0 && (
                      <button
                        onClick={() => setMediaToDelete([])}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#666',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          marginTop: '10px'
                        }}
                      >
                        Clear Selection ({mediaToDelete.length})
                      </button>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => setEditForm({ ...editForm, newMedia: Array.from(e.target.files) })}
                      style={{ marginBottom: '10px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleUpdate(location._id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save {mediaToDelete.length > 0 ? `(${mediaToDelete.length} to delete)` : ''}
                    </button>
                    <button
                      onClick={() => {
                        setEditingLocation(null);
                        setMediaToDelete([]);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#666',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display mode
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ 
                    flex: '1',
                    overflow: 'auto',
                    marginBottom: '10px'
                  }}>
                    <p style={{ 
                      fontSize: '14px',
                      marginBottom: '10px',
                      maxHeight: '60px',
                      overflow: 'auto'
                    }}>
                      {location.content.text}
                    </p>
                    {location.locationType && LOCATION_TYPES[location.locationType] && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '0.95em', color: '#1976d2', fontWeight: 500 }}>
                        <span>{LOCATION_TYPES[location.locationType].icon}</span>
                        <span>{LOCATION_TYPES[location.locationType].label}</span>
                      </div>
                    )}
                    <KeywordsDisplay keywords={location.keywords} />
                    <div style={{ 
                      height: '150px',
                      marginBottom: '10px',
                      overflow: 'hidden'
                    }}>
                      {renderLocationMedia(location)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', marginBottom: '20px' }}>
                    <button
                      onClick={() => handleEdit(location)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location._id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messaging Panel (replaces old modal) */}
      {showMessaging && (
        <MessagingPanel onClose={() => setShowMessaging(false)} />
      )}
    </div>
  );
}

export default ProfilePage; 