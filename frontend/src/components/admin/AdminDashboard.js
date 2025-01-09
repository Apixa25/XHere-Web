import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('locations');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      const usersWithLocationCounts = data.map(user => ({
        ...user,
        locationCount: user.locationCount || 0
      }));
      
      setUsers(usersWithLocationCounts);
      setLoading(false);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(`Failed to load users: ${err.message}`);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/admin/search?query=${encodeURIComponent(searchQuery)}&type=${searchType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      console.log('Search results:', data);
      setSearchResults(data);
      setLoading(false);
    } catch (err) {
      console.error('Search error:', err);
      setError(`Search failed: ${err.message}`);
      setLoading(false);
    }
  };

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
        const response = await fetch(`http://localhost:3000/api/admin/locations/${locationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete location');
        }

        // Remove the deleted location from search results
        setSearchResults(prevResults => 
          prevResults.filter(location => location.id !== locationId)
        );
      } catch (err) {
        console.error('Delete location error:', err);
        setError('Failed to delete location');
      }
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          Back to Map
        </button>
        <h2>Admin Dashboard</h2>
      </div>
      
      {loading && <div>Loading users...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      {!loading && !error && (
        <>
          <div className="search-section">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search content..."
              className="search-input"
            />
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="search-select"
            >
              <option value="locations">Locations</option>
              <option value="flagged">Flagged Content</option>
              <option value="recent">Recent Content</option>
            </select>
            <button onClick={handleSearch} className="search-button">
              Search
            </button>
          </div>

          <div className="users-section">
            <h3>Users ({users.length})</h3>
            {users.length === 0 ? (
              <p>No users found</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Credits</th>
                    <th>Locations</th>
                    <th>Admin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
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

          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results ({searchResults.length})</h3>
              <div className="location-grid">
                {searchResults.map(location => (
                  <div key={location.id} className="location-card">
                    <div className="location-header">
                      <span className="location-date">
                        {new Date(location.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteLocation(location.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </div>
                    <div className="location-content">
                      <p>{location.content.text}</p>
                      {renderMediaPreview(location.content.mediaUrls, location.content.mediaTypes)}
                    </div>
                    <div className="location-footer">
                      <span>By: {location.creator.email}</span>
                      <span>Points: {location.totalPoints}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard; 