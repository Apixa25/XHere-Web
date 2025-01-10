import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const BACKEND_URL = 'http://localhost:3000';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('locations');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [failedImages, setFailedImages] = useState(new Set());
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    console.log('Attempting to load users...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Admin API Response:', response);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Users data received:', data);
      data.forEach(user => {
        console.log(`User ${user.email}: ${user.locationCount} locations`);
      });
      
      setUsers(data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(`Failed to load users: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      console.log('Starting search:', { type: searchType, query: searchQuery });
      const token = localStorage.getItem('token');
      const searchUrl = `${BACKEND_URL}/api/admin/search?type=${searchType}&query=${encodeURIComponent(searchQuery)}`;
      console.log('Search URL:', searchUrl);

      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Search response status:', response.status);

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const results = await response.json();
      console.log('Search results:', {
        count: results.length,
        firstResult: results[0],
        mediaUrls: results[0]?.content?.mediaUrls,
        mediaTypes: results[0]?.content?.mediaTypes
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setError('Search failed: ' + error.message);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = sortField === 'locationCount' ? (a[sortField] || 0) : a[sortField];
    let bValue = sortField === 'locationCount' ? (b[sortField] || 0) : b[sortField];
    
    if (sortField === 'profile.name') {
      aValue = a.profile?.name || '';
      bValue = b.profile?.name || '';
    }
    
    if (aValue === bValue) return 0;
    
    const comparison = aValue > bValue ? 1 : -1;
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This will also delete all their content.')) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete user');
        }

        // Remove the deleted user from the state
        setUsers(users.filter(user => user.id !== userId));
        setLoading(false);
      } catch (err) {
        console.error('Delete error:', err);
        setError(err.message);
        setLoading(false);
      }
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/admin/locations/${locationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete location');
        }

        // Remove the deleted location from search results
        setSearchResults(prevResults => 
          prevResults.filter(result => result.id !== locationId)
        );
      } catch (err) {
        console.error('Delete location error:', err);
        setError('Failed to delete location');
      }
    }
  };

  const handleEditLocation = async (location) => {
    const newText = prompt('Edit location text:', location.content?.text);
    if (newText === null) return; // User cancelled

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/locations/${location.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: newText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // Update the location in search results
      setSearchResults(prevResults => 
        prevResults.map(result => 
          result.id === location.id 
            ? { ...result, content: { ...result.content, text: newText } }
            : result
        )
      );
    } catch (err) {
      console.error('Edit location error:', err);
      setError('Failed to edit location');
    }
  };

  const renderMediaPreview = (mediaUrls, mediaTypes) => {
    if (!mediaUrls || mediaUrls.length === 0) return null;

    return (
      <div className="media-preview">
        {mediaUrls.map((url, index) => {
          const mediaType = mediaTypes[index];
          
          if (mediaType?.startsWith('image/')) {
            return (
              <img
                key={index}
                src={`http://localhost:3000/${url}`}
                alt={`Location media ${index + 1}`}
                className="media-thumbnail"
                onClick={() => window.open(`http://localhost:3000/${url}`, '_blank')}
              />
            );
          } else if (mediaType?.startsWith('video/')) {
            return (
              <video
                key={index}
                controls
                className="media-thumbnail"
              >
                <source src={`http://localhost:3000/${url}`} type={mediaType} />
                Your browser does not support the video tag.
              </video>
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  const handleImageError = (url) => {
    if (!failedImages.has(url)) {
      console.log(`First-time image load error for ${url}`);
      setFailedImages(prev => new Set([...prev, url]));
    }
    return '/placeholder-image.png';
  };

  const fetchUserLocations = async (userId) => {
    try {
      setLoadingLocations(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/user-locations/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user locations');
      }

      const data = await response.json();
      setUserLocations(data);
      setSelectedUserId(selectedUserId === userId ? null : userId); // Toggle view
    } catch (error) {
      console.error('Error fetching user locations:', error);
      alert('Failed to fetch user locations');
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/locations/${editingLocation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: {
            ...editingLocation.content,
            text: editText
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // Refresh the user's locations
      await fetchUserLocations(selectedUserId);
      setEditingLocation(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <button className="back-button" onClick={() => navigate('/')}>
          Back to Map
        </button>
      </div>

      {/* Search Section */}
      <div className="search-section">
        <select 
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="search-type"
        >
          <option value="locations">Locations</option>
          <option value="users">Users</option>
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${searchType}...`}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-button">
          Search
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results ({searchResults.length})</h3>
          <div className="result-list">
            {searchResults.map(result => (
              <div key={result.id} className="result-item">
                {searchType === 'users' ? (
                  <div className="user-result">
                    <div className="user-info">
                      <strong>{result.email}</strong>
                      <small>{result.profile?.name || 'No name set'}</small>
                      <div className="user-stats">
                        <span>Credits: {result.credits}</span>
                        <span>Locations: {result.locationCount}</span>
                        <span>{result.isAdmin ? '👑 Admin' : 'User'}</span>
                      </div>
                      <button 
                        onClick={() => fetchUserLocations(result.id)}
                        className="view-locations-button"
                      >
                        {selectedUserId === result.id ? 'Hide Locations' : 'View Locations'}
                      </button>
                      
                      {selectedUserId === result.id && (
                        <div className="user-locations">
                          {loadingLocations ? (
                            <div className="loading">Loading locations...</div>
                          ) : (
                            userLocations.length > 0 ? (
                              userLocations.map(location => (
                                <div key={location.id} className="location-item">
                                  <div className="location-content">
                                    {editingLocation?.id === location.id ? (
                                      <div className="edit-form">
                                        <textarea
                                          value={editText}
                                          onChange={(e) => setEditText(e.target.value)}
                                          className="edit-textarea"
                                        />
                                        <div className="edit-actions">
                                          <button 
                                            onClick={handleSaveEdit}
                                            className="save-button"
                                          >
                                            Save
                                          </button>
                                          <button 
                                            onClick={() => setEditingLocation(null)}
                                            className="cancel-button"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <strong>{location.content?.text}</strong>
                                        <small>Created: {new Date(location.createdAt).toLocaleDateString()}</small>
                                        <div className="location-stats">
                                          <span>👍 {location.upvotes || 0}</span>
                                          <span>👎 {location.downvotes || 0}</span>
                                          <span>Status: {location.verificationStatus}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div className="location-actions">
                                    <button 
                                      onClick={() => handleEditLocation(location)}
                                      className="edit-button"
                                      disabled={editingLocation !== null}
                                    >
                                      ✏️ Edit
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteLocation(location.id)}
                                      className="delete-button"
                                      disabled={editingLocation !== null}
                                    >
                                      🗑️ Delete
                                    </button>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="no-locations">No locations found for this user</div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                    {!result.isAdmin && (
                      <button 
                        onClick={() => handleDeleteUser(result.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <strong>{result.content?.text}</strong>
                    <small>Created by: {result.creator?.email}</small>
                    {result.content?.mediaUrls && result.content.mediaUrls.length > 0 && (
                      <div className="media-preview">
                        {result.content.mediaUrls.map((url, index) => {
                          const fullUrl = `${BACKEND_URL}/${url}`;
                          return (
                            <div key={index} className="media-item">
                              {result.content.mediaTypes[index]?.startsWith('image') ? (
                                failedImages.has(fullUrl) ? (
                                  <div className="placeholder-image">
                                    <span>Image not available</span>
                                  </div>
                                ) : (
                                  <img 
                                    src={fullUrl}
                                    alt={`Location media ${index + 1}`}
                                    onError={() => handleImageError(fullUrl)}
                                  />
                                )
                              ) : (
                                <video controls>
                                  <source src={fullUrl} type={result.content.mediaTypes[index]} />
                                  Your browser does not support the video tag.
                                </video>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="result-actions">
                      <button 
                        onClick={() => handleEditLocation(result)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteLocation(result.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="users-section">
        <h3>Users ({users.length})</h3>
        {users.length === 0 ? (
          <p>No users found</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('email')} style={headerStyle}>
                  Email {getSortIcon('email')}
                </th>
                <th onClick={() => handleSort('profile.name')} style={headerStyle}>
                  Name {getSortIcon('profile.name')}
                </th>
                <th onClick={() => handleSort('credits')} style={headerStyle}>
                  Credits {getSortIcon('credits')}
                </th>
                <th onClick={() => handleSort('locationCount')} style={headerStyle}>
                  Locations {getSortIcon('locationCount')}
                </th>
                <th>Admin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(user => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.profile?.name || 'N/A'}</td>
                  <td>{user.credits}</td>
                  <td>{user.locationCount || 0}</td>
                  <td>{user.isAdmin ? '✓' : ''}</td>
                  <td>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="delete-button"
                      disabled={user.isAdmin}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const headerStyle = {
  cursor: 'pointer',
  userSelect: 'none',
  position: 'relative',
  paddingRight: '20px'
};

export default AdminDashboard; 