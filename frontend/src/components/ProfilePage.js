import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function ProfilePage({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const [editingLocation, setEditingLocation] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  // Form state for editing locations
  const [editForm, setEditForm] = useState({
    text: '',
    media: []
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchUserProfile();
    fetchUserLocations();
  }, [user, navigate]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching profile from:', 'http://localhost:3000/api/users/profile');
      const response = await fetch('http://localhost:3000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      // Log the response details
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text(); // Get the actual response text
        console.error('Received non-JSON response:', text);
        throw new Error('API response was not JSON');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const fetchUserLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching locations from:', 'http://localhost:3000/api/users/locations');
      const response = await fetch('http://localhost:3000/api/users/locations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      // Log response details
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error('API response was not JSON');
      }

      const data = await response.json();
      setUserLocations(data);
    } catch (error) {
      console.error('Error fetching user locations:', error);
      setUserLocations([]);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    try {
      const response = await fetch('http://localhost:3000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      if (response.ok) {
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!editingLocation) return;

    const formData = new FormData();
    formData.append('text', editForm.text);
    editForm.media.forEach(file => {
      formData.append('media', file);
    });

    try {
      const response = await fetch(`http://localhost:3000/api/locations/${editingLocation._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (response.ok) {
        setEditingLocation(null);
        fetchUserLocations();
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchUserLocations();
      }
    } catch (error) {
      console.error('Error deleting location:', error);
    }
  };

  return (
    <div className="profile-page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Profile</h1>
        <Link to="/">
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>Back to Map</button>
        </Link>
      </div>
      
      {/* Profile Section */}
      <section className="profile-section" style={{ marginBottom: '40px' }}>
        <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="profile-image">
            <img 
              src={profile?.profileImage ? `http://localhost:3000/${profile.profileImage}` : 'default-avatar.png'} 
              alt="Profile"
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div className="profile-info">
            <h2>{profile?.name || user.email}</h2>
            <p>Email: {user.email}</p>
          </div>
        </div>
        
        {/* Profile Image Upload Form */}
        <form onSubmit={handleUpdateProfile} style={{ marginTop: '20px' }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])}
          />
          <button type="submit">Update Profile Picture</button>
        </form>
      </section>

      {/* User Locations Section */}
      <section className="locations-section">
        <h2>My Locations</h2>
        <div className="locations-grid" style={{ display: 'grid', gap: '20px' }}>
          {userLocations.map(location => (
            <div key={location._id} className="location-card" style={{ 
              border: '1px solid #ddd', 
              padding: '15px',
              borderRadius: '8px'
            }}>
              {editingLocation?._id === location._id ? (
                <form onSubmit={handleUpdateLocation}>
                  <textarea
                    value={editForm.text}
                    onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                    style={{ width: '100%', marginBottom: '10px' }}
                  />
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setEditForm({ ...editForm, media: Array.from(e.target.files) })}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button type="submit">Save Changes</button>
                    <button type="button" onClick={() => setEditingLocation(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <p>{location.content.text}</p>
                  <div className="media-grid" style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                    {location.content.mediaUrls?.map((url, index) => (
                      location.content.mediaTypes[index].startsWith('image') ? (
                        <img 
                          key={index}
                          src={`http://localhost:3000/${url}`}
                          alt="Location media"
                          style={{ maxWidth: '100%' }}
                        />
                      ) : (
                        <video 
                          key={index}
                          src={`http://localhost:3000/${url}`}
                          controls
                          style={{ maxWidth: '100%' }}
                        />
                      )
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button onClick={() => {
                      setEditingLocation(location);
                      setEditForm({ text: location.content.text, media: [] });
                    }}>Edit</button>
                    <button onClick={() => handleDeleteLocation(location._id)}>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ProfilePage; 