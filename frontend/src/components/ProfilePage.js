import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ProfilePage({ user }) {
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editForm, setEditForm] = useState({ text: '', newMedia: [] });
  const [mediaToDelete, setMediaToDelete] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserLocations();
  }, [user, navigate]);

  const fetchUserLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch('http://localhost:3000/api/user/locations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      setUserLocations(data.filter(location => location.creator._id === user?.userId));
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/locations/${locationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setUserLocations(userLocations.filter(loc => loc._id !== locationId));
        } else {
          throw new Error('Failed to delete location');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setEditForm({ text: location.content.text, newMedia: [] });
  };

  const handleMediaDelete = (index) => {
    setMediaToDelete([...mediaToDelete, index]);
  };

  const handleUpdate = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // Add text content
      formData.append('text', editForm.text);
      
      // Add media deletion indexes
      if (mediaToDelete.length > 0) {
        console.log('Media indexes to delete:', mediaToDelete);
        formData.append('deleteMediaIndexes', JSON.stringify(mediaToDelete));
      }
      
      // Add new media files
      editForm.newMedia.forEach(file => {
        formData.append('media', file);
      });

      console.log('==== UPDATE REQUEST DEBUG ====');
      console.log('URL:', `http://localhost:3000/api/locations/${locationId}`);
      console.log('Method:', 'PUT');
      console.log('Token:', token);
      console.log('FormData contents:', {
        text: editForm.text,
        mediaCount: editForm.newMedia.length,
        deleteMediaIndexes: mediaToDelete
      });

      const response = await fetch(`http://localhost:3000/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers));

      if (!response.ok) {
        const text = await response.text();
        console.error('Error response:', text);
        throw new Error(`Failed to update location: ${text}`);
      }

      const updatedLocation = await response.json();
      console.log('Updated location:', updatedLocation);
      console.log('====================');
      
      setUserLocations(userLocations.map(loc => 
        loc._id === locationId ? updatedLocation : loc
      ));
      setEditingLocation(null);
      setMediaToDelete([]); // Reset media to delete array
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
    }
  };

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h1>{user.email.split('@')[0]}'s Profile</h1>
        <button 
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Map
        </button>
      </div>
      
      <p>Email: {user.email}</p>
      
      <h2>Your Locations</h2>
      {userLocations.length === 0 ? (
        <p>You haven't added any locations yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
          {userLocations.map(location => (
            <div 
              key={location._id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {editingLocation?._id === location._id ? (
                // Edit form
                <div>
                  <textarea
                    value={editForm.text}
                    onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                  />
                  {location.content.mediaUrls?.map((url, index) => (
                    !mediaToDelete.includes(index) && (
                      <div key={index} style={{ position: 'relative', marginBottom: '10px' }}>
                        <img
                          src={`http://localhost:3000/${url}`}
                          alt="Location media"
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                        <button
                          onClick={() => handleMediaDelete(index)}
                          style={{
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            backgroundColor: '#ff4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  ))}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setEditForm({ ...editForm, newMedia: Array.from(e.target.files) })}
                    style={{ marginBottom: '10px' }}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleUpdate(location._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingLocation(null);
                        setMediaToDelete([]);
                      }}
                      style={{
                        padding: '8px 16px',
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
                <>
                  <p style={{ fontSize: '16px', marginBottom: '10px' }}>{location.content.text}</p>
                  {location.content.mediaUrls?.map((url, index) => (
                    <img
                      key={index}
                      src={`http://localhost:3000/${url}`}
                      alt="Location media"
                      style={{
                        width: '100%',
                        height: '150px',
                        objectFit: 'cover',
                        borderRadius: '4px',
                        marginBottom: '10px'
                      }}
                    />
                  ))}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleEdit(location)}
                      style={{
                        padding: '8px 16px',
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
                      onClick={() => handleDelete(location._id)}
                      style={{
                        padding: '8px 16px',
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
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfilePage; 