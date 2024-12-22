import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

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

  const handleImmediateMediaDelete = async (locationId, mediaIndex) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('deleteMediaIndexes', JSON.stringify([mediaIndex]));

      const response = await fetch(`http://localhost:3000/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      const updatedLocation = await response.json();
      
      // Update the locations list with the new data
      setUserLocations(userLocations.map(loc => 
        loc._id === locationId ? updatedLocation : loc
      ));
      
      // Update the editing location if it's currently being edited
      if (editingLocation?._id === locationId) {
        setEditingLocation(updatedLocation);
        setEditForm({
          ...editForm,
          text: updatedLocation.content.text
        });
      }
    } catch (err) {
      console.error('Error deleting media:', err);
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>Welcome, {user?.email}</h2>
        <Link to="/">
          <button style={{
            padding: '8px 16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}>
            Back to Map
          </button>
        </Link>
      </div>

      <h3>Your Locations</h3>
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
                            onClick={() => handleImmediateMediaDelete(location._id, index)}
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