import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function ProfilePage({ user, onLocationUpdate }) {
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editForm, setEditForm] = useState({ text: '', newMedia: [] });
  const [mediaToDelete, setMediaToDelete] = useState([]);
  const navigate = useNavigate();

  const fetchUserLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('Fetching with token:', token);
      
      const endpoint = user.isAdmin ? 
        'http://localhost:3000/api/locations' : 
        'http://localhost:3000/api/user/locations';
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      console.log('Fetched locations:', data);
      
      setUserLocations(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user locations:', error);
      setError('Failed to fetch locations');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserLocations();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('Current user object:', user);
  }, [user]);

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
    setEditForm({ text: location.content.text, newMedia: [] });
  };

  const handleMediaDelete = (index) => {
    setMediaToDelete([...mediaToDelete, index]);
  };

  const handleUpdate = async (locationId) => {
    try {
      console.log('Attempting to update location:', locationId);
      console.log('Form data:', editForm); // Debug log
      const token = localStorage.getItem('token');
      
      // Create FormData to handle both text and files
      const formData = new FormData();
      formData.append('text', editForm.text);
      
      // Add any new media files
      if (editForm.newMedia && editForm.newMedia.length > 0) {
        editForm.newMedia.forEach(file => {
          formData.append('media', file);
        });
      }
      
      // Add media deletion indexes if any
      if (mediaToDelete.length > 0) {
        formData.append('deleteMediaIndexes', JSON.stringify(mediaToDelete));
      }

      const response = await fetch(`http://localhost:3000/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type here, let browser set it for FormData
        },
        body: formData
      });

      console.log('Update response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update location');
      }

      const updatedLocation = await response.json();
      console.log('Updated location:', updatedLocation);
      
      setUserLocations(prevLocations => 
        prevLocations.map(loc => 
          loc._id === locationId ? updatedLocation : loc
        )
      );
      
      setEditingLocation(null);
      setMediaToDelete([]);
      setEditForm({ text: '', newMedia: [] });
      onLocationUpdate();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
    }
  };

  const handleDeleteMedia = async (locationId, mediaIndex) => {
    console.log('Attempting to delete media at index:', mediaIndex);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/locations/${locationId}/media/${mediaIndex}`, {
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
          if (location._id === locationId) {
            // Create new arrays without the deleted media
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h2 style={{ 
            marginBottom: '8px',
            color: '#333'
          }}>
            Welcome, {user?.profile?.name || 'User'}
          </h2>
          <p style={{ 
            color: '#666',
            fontSize: '14px'
          }}>
            {user?.email}
            {user.isAdmin && <span style={{ marginLeft: '8px', color: '#2196F3' }}>(Admin)</span>}
          </p>
        </div>
        <Link to="/">
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'background-color 0.3s'
          }}>
            Back to Map
          </button>
        </Link>
      </div>

      <h3>{user.isAdmin ? 'All Locations' : 'Your Locations'}</h3>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error}</p>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(315px, 1fr))',
          gap: '20px',
          justifyContent: 'center',
          padding: '20px',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {userLocations.map(location => (
            <div
              key={location._id}
              style={{
                width: '275px',
                height: '275px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                margin: '0 auto'
              }}
            >
              {location.creator._id !== user._id && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginBottom: '8px' 
                }}>
                  Created by: {location.creator.profile?.name || location.creator.email}
                </div>
              )}
              
              {editingLocation?._id === location._id ? (
                // Edit mode
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
                          height: '60px',
                          width: '100%'
                        }}>
                          {location.content.mediaTypes[index].startsWith('video/') ? (
                            <video
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            >
                              <source src={`http://localhost:3000/${url}`} type={location.content.mediaTypes[index]} />
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img
                              src={`http://localhost:3000/${url}`}
                              alt={`Media ${index + 1}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          )}
                          <button
                            onClick={() => handleDeleteMedia(location._id, index)}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              padding: '2px 5px',
                              backgroundColor: 'rgba(244, 67, 54, 0.9)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '2px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={(e) => setEditForm({ ...editForm, newMedia: Array.from(e.target.files) })}
                      style={{ marginBottom: '5px' }}
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
                      Save
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
                    <div style={{ 
                      height: '150px',
                      marginBottom: '10px',
                      overflow: 'hidden'
                    }}>
                      {location.content.mediaUrls?.map((url, index) => {
                        const mediaType = location.content.mediaTypes[index];
                        
                        if (mediaType.startsWith('video/')) {
                          return (
                            <video
                              key={index}
                              controls
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            >
                              <source src={`http://localhost:3000/${url}`} type={mediaType} />
                              Your browser does not support the video tag.
                            </video>
                          );
                        } else {
                          return (
                            <img
                              key={index}
                              src={`http://localhost:3000/${url}`}
                              alt="Location media"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '4px'
                              }}
                            />
                          );
                        }
                      })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {console.log('Checking edit/delete permissions:', {
                      isAdmin: user.isAdmin,
                      userId: user.userId || user._id,
                      creatorId: location.creator._id,
                      canEdit: user.isAdmin || location.creator._id === (user.userId || user._id)
                    })}
                    
                    {(user.isAdmin || location.creator._id === (user.userId || user._id)) && (
                      <>
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
                          onClick={() => handleDelete(location._id)}
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
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProfilePage; 