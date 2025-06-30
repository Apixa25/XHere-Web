import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const BACKEND_URL = 'http://localhost:3000';

const UserLocationsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLocations, setUserLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editText, setEditText] = useState('');
  const [failedImages, setFailedImages] = useState(new Set());

  // Fetch user details and locations
  const fetchUserAndLocations = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch user details
      const userResponse = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details');
      }

      const users = await userResponse.json();
      const currentUser = users.find(u => u.id === userId);
      if (!currentUser) {
        throw new Error('User not found');
      }
      setUser(currentUser);

      // Fetch user locations
      const locationsResponse = await fetch(`${BACKEND_URL}/api/admin/user-locations/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!locationsResponse.ok) {
        throw new Error('Failed to fetch user locations');
      }

      const locations = await locationsResponse.json();
      setUserLocations(locations);
    } catch (error) {
      console.error('Error fetching user and locations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserAndLocations();
  }, [fetchUserAndLocations]);

  const handleViewOnMap = (location) => {
    if (!location.location?.coordinates) {
      alert('Location coordinates not available');
      return;
    }

    const lat = Number(location.location.coordinates[1]);
    const lng = Number(location.location.coordinates[0]);
    
    // Store the location coordinates in localStorage for the main map to use
    localStorage.setItem('adminViewLocation', JSON.stringify({
      lat,
      lng,
      locationId: location.id
    }));
    
    // Store a flag indicating we came from admin dashboard
    localStorage.setItem('cameFromAdmin', 'true');
    
    // Navigate to the main map
    navigate('/');
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

        // Remove the deleted location from the list
        setUserLocations(prevLocations => 
          prevLocations.filter(location => location.id !== locationId)
        );
      } catch (err) {
        console.error('Delete location error:', err);
        setError('Failed to delete location');
      }
    }
  };

  const startEditing = (location) => {
    console.log('Starting edit for location:', location);
    const currentText = location.content?.text || '';
    console.log('Setting initial edit text:', currentText);
    setEditText(currentText);
    setEditingLocation(location);
  };

  const handleEditLocation = async (location) => {
    try {
      console.log('Editing location:', location);
      
      if (!editText.trim()) {
        alert('Location text cannot be empty');
        return;
      }
      
      const token = localStorage.getItem('token');
      
      const updatedContent = {
        text: editText.trim(),
        mediaUrls: location.content?.mediaUrls || [],
        mediaTypes: location.content?.mediaTypes || [],
        isAnonymous: location.content?.isAnonymous || false
      };
      
      const response = await fetch(`${BACKEND_URL}/api/admin/locations/${location.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: updatedContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // Refresh the locations
      await fetchUserAndLocations();
      setEditingLocation(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating location:', error);
      alert(`Failed to update location: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
    setEditText('');
  };

  const handleImageError = (imageUrl) => {
    setFailedImages(prev => new Set(prev).add(imageUrl));
  };

  // Add this before rendering
  console.log('UserLocationsPage: userLocations array:', userLocations);

  const renderLocationItem = (location) => (
    <div key={location.id} className="location-item">
      <div className="location-content">
        <strong style={{ fontSize: '18px', color: '#222' }}>
          {location.content?.text || "No description"}
        </strong>
        <div style={{ margin: '6px 0' }}>
          <small>
            <b>Type:</b> {location.locationType || "N/A"}
            {" | "}
            <b>Status:</b> {location.verificationStatus || "N/A"}
            {" | "}
            <b>Created:</b> {location.createdAt ? new Date(location.createdAt).toLocaleString() : "N/A"}
          </small>
        </div>
        <div style={{ margin: '6px 0' }}>
          <b>Upvotes:</b> {location.upvotes ?? 0} &nbsp;
          <b>Downvotes:</b> {location.downvotes ?? 0}
        </div>
        {location.location?.coordinates && (
          <div style={{ margin: '6px 0' }}>
            <b>Coordinates:</b> {location.location.coordinates[1]}, {location.location.coordinates[0]}
          </div>
        )}
        {location.content?.mediaUrls && location.content.mediaUrls.length > 0 && (
          <div style={{ margin: '6px 0' }}>
            <b>Media:</b>
            <div style={{ display: 'flex', gap: 8 }}>
              {location.content.mediaUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={`http://localhost:3000/${url}`}
                  alt={`media-${idx}`}
                  style={{ maxWidth: 80, maxHeight: 80, borderRadius: 4, border: '1px solid #ccc' }}
                />
              ))}
            </div>
          </div>
        )}
        <div style={{ margin: '6px 0' }}>
          <b>Keywords:</b> {location.keywords?.join(', ') || "None"}
        </div>
        <div style={{ margin: '6px 0', fontSize: '12px', color: '#888' }}>
          <b>ID:</b> {location.id}
        </div>
      </div>
      <div className="location-actions">
        <button 
          onClick={() => startEditing(location)}
          className="edit-button"
          disabled={editingLocation !== null}
          title="Edit location"
        >
          ✏️ Edit
        </button>
        <button 
          onClick={() => handleDeleteLocation(location.id)}
          className="delete-button"
          disabled={editingLocation !== null}
          title="Delete location"
        >
          🗑️ Delete
        </button>
        <button 
          onClick={() => handleViewOnMap(location)}
          className="view-on-map-button"
          disabled={editingLocation !== null}
          title="View on Map"
        >
          🌍 View on Map
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="loading">Loading user locations...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;
  if (!user) return <div className="error-message">User not found</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>📍 User Locations</h2>
        <div className="header-actions">
          <button className="back-button" onClick={() => navigate('/admin')}>
            ← Back to Admin
          </button>
        </div>
      </div>

      <div className="user-info-section">
        <h3>User Information</h3>
        <div className="user-details">
          <p><strong>Name:</strong> {user.profile?.name || 'N/A'}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Credits:</strong> {user.credits}</p>
          <p><strong>Total Locations:</strong> {user.locationCount || 0}</p>
          <p><strong>Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="locations-section">
        <h3>User Locations ({userLocations.length})</h3>
        {userLocations.length === 0 ? (
          <div className="no-locations">
            <p>This user hasn't created any locations yet.</p>
          </div>
        ) : (
          <div className="locations-grid">
            {userLocations.map(location => renderLocationItem(location))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserLocationsPage; 