import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  
  // Cleanup monitoring state
  const [cleanupStats, setCleanupStats] = useState(null);
  const [cleanupHistory, setCleanupHistory] = useState([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'cleanup', 'search', 'status', 'moderator'
  
  // Status management state
  const [statusStats, setStatusStats] = useState({
    pending: 0,
    verified: 0,
    flagged: 0,
    removed: 0,
    total: 0
  });
  const [locationsByStatus, setLocationsByStatus] = useState({});
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Moderator review queue state
  const [reviewQueue, setReviewQueue] = useState([]);
  const [moderatorStats, setModeratorStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });
  const [moderatorLoading, setModeratorLoading] = useState(false);
  const [selectedTrustLevel, setSelectedTrustLevel] = useState('all');

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

  const handleSearch = async (type, query) => {
    try {
      console.log('Starting search:', { type, query });
      const token = localStorage.getItem('token');
      const searchUrl = `${BACKEND_URL}/api/admin/search?type=${type}&query=${query}`;
      
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
      console.log('Search results:', results);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      alert('Search failed');
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

  const handleUserSelect = async (userId) => {
    console.log('Selecting user:', userId);
    // Navigate to dedicated user locations page
    navigate(`/admin/user/${userId}/locations`);
  };

  // Add this effect to monitor state changes
  useEffect(() => {
    if (searchType === 'locations') {
      console.log('Current search results:', searchResults);
    }
  }, [searchResults, searchType]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Load cleanup statistics
  const loadCleanupStats = async () => {
    try {
      setCleanupLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/cleanup/detailed-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCleanupStats(data);
    } catch (err) {
      console.error('Error loading cleanup stats:', err);
      setError(`Failed to load cleanup stats: ${err.message}`);
    } finally {
      setCleanupLoading(false);
    }
  };

  // Load cleanup history
  const loadCleanupHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/cleanup/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCleanupHistory(data);
    } catch (err) {
      console.error('Error loading cleanup history:', err);
      setError(`Failed to load cleanup history: ${err.message}`);
    }
  };

  // Perform manual cleanup
  const performCleanup = async (type) => {
    try {
      setCleanupLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/cleanup/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Cleanup failed');
      }

      const result = await response.json();
      console.log('Cleanup result:', result);
      
      // Reload stats after cleanup
      await loadCleanupStats();
      await loadCleanupHistory();
      
      alert(`Cleanup completed: ${result.message}`);
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Cleanup failed');
    } finally {
      setCleanupLoading(false);
    }
  };

  // Load cleanup data when cleanup tab is active
  useEffect(() => {
    if (activeTab === 'cleanup') {
      loadCleanupStats();
      loadCleanupHistory();
    }
  }, [activeTab]);

  // Status management functions
  const loadStatusStats = async () => {
    try {
      setStatusLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/locations/status/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load status stats');
      }

      const data = await response.json();
      setStatusStats(data.stats);
    } catch (error) {
      console.error('Error loading status stats:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const loadLocationsByStatus = async (status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/locations/status/${status}?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load ${status} locations`);
      }

      const data = await response.json();
      setLocationsByStatus(prev => ({
        ...prev,
        [status]: data.locations
      }));
    } catch (error) {
      console.error(`Error loading ${status} locations:`, error);
    }
  };

  const updateLocationStatus = async (locationId, newStatus, reason) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/locations/${locationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus, reason })
      });

      if (!response.ok) {
        throw new Error('Failed to update location status');
      }

      const result = await response.json();
      console.log('Status update result:', result);
      
      // Reload status stats
      await loadStatusStats();
      
      // Reload locations for the affected status
      await loadLocationsByStatus(newStatus);
      if (result.previousStatus !== newStatus) {
        await loadLocationsByStatus(result.previousStatus);
      }
      
      alert(`Location status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating location status:', error);
      alert('Failed to update location status');
    }
  };

  // Moderator functions
  const loadReviewQueue = async () => {
    try {
      setModeratorLoading(true);
      const token = localStorage.getItem('token');
      console.log('🔍 Loading review queue for ALL levels...');
      
      const response = await fetch(`${BACKEND_URL}/api/moderator/review-queue`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load review queue');
      }

      const data = await response.json();
      console.log('📊 Review queue response:', data);
      
      // Handle both response structures: data.locations and data.pendingLocations
      const locations = data.locations || data.pendingLocations || [];
      console.log('📍 Locations found:', locations.length);
      console.log('📍 Location details:', locations.map(loc => ({
        id: loc.id,
        status: loc.locationStatus,
        requiresApproval: loc.requiresApproval,
        creatorTrustLevel: loc.creator?.trustLevel,
        creatorEmail: loc.creator?.email
      })));
      
      setReviewQueue(locations);
      setModeratorLoading(false);
    } catch (err) {
      console.error('Error loading review queue:', err);
      setError('Failed to load review queue');
      setModeratorLoading(false);
    }
  };

  const loadModeratorStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/moderator/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load moderator stats');
      }

      const data = await response.json();
      setModeratorStats(data);
    } catch (err) {
      console.error('Error loading moderator stats:', err);
    }
  };

  const approveLocation = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/moderator/approve/${locationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Approved by moderator' })
      });

      if (!response.ok) {
        throw new Error('Failed to approve location');
      }

      // Remove from review queue and refresh
      setReviewQueue(prev => prev.filter(loc => loc.id !== locationId));
      await loadModeratorStats();
      
      alert('Location approved successfully!');
    } catch (err) {
      console.error('Error approving location:', err);
      setError('Failed to approve location');
    }
  };

  const rejectLocation = async (locationId, reason = 'Rejected by moderator') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/moderator/reject/${locationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject location');
      }

      // Remove from review queue and refresh
      setReviewQueue(prev => prev.filter(loc => loc.id !== locationId));
      await loadModeratorStats();
      
      alert('Location rejected successfully!');
    } catch (err) {
      console.error('Error rejecting location:', err);
      setError('Failed to reject location');
    }
  };

  const loadLocationsByTrustLevel = async (trustLevel) => {
    try {
      const token = localStorage.getItem('token');
      const url = trustLevel === 'all' 
        ? `${BACKEND_URL}/api/moderator/review-queue`
        : `${BACKEND_URL}/api/moderator/locations/${trustLevel}`;
      
      console.log(`🔍 Loading locations for trust level: ${trustLevel}`);
      console.log(`🔗 URL: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load locations by trust level');
      }

      const data = await response.json();
      console.log(`📊 ${trustLevel} trust level response:`, data);
      
      // Handle both response structures: data.locations and data.pendingLocations
      const locations = data.locations || data.pendingLocations || [];
      console.log(`📍 ${trustLevel} locations found:`, locations.length);
      console.log(`📍 ${trustLevel} location details:`, locations.map(loc => ({
        id: loc.id,
        status: loc.locationStatus,
        requiresApproval: loc.requiresApproval,
        creatorTrustLevel: loc.creator?.trustLevel,
        creatorEmail: loc.creator?.email,
        text: loc.content?.text?.substring(0, 50) + '...'
      })));
      
      setReviewQueue(locations);
    } catch (err) {
      console.error('Error loading locations by trust level:', err);
      setError('Failed to load locations by trust level');
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

      {/* Tab Navigation */}
      <div className="tab-buttons">
        <button 
          className={activeTab === 'users' ? 'active' : ''} 
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={activeTab === 'cleanup' ? 'active' : ''} 
          onClick={() => setActiveTab('cleanup')}
        >
          🧹 Cleanup
        </button>
        <button 
          className={activeTab === 'search' ? 'active' : ''} 
          onClick={() => setActiveTab('search')}
        >
          🔍 Search
        </button>
        <button 
          className={activeTab === 'status' ? 'active' : ''} 
          onClick={() => {
            setActiveTab('status');
            loadStatusStats();
          }}
        >
          📍 Status Management
        </button>
        <button 
          className={activeTab === 'moderator' ? 'active' : ''} 
          onClick={() => {
            setActiveTab('moderator');
            loadReviewQueue();
            loadModeratorStats();
          }}
        >
          👮‍♂️ Moderator Queue
        </button>
      </div>

      {/* Cleanup Monitoring Tab */}
      {activeTab === 'cleanup' && (
        <div className="cleanup-section">
          <div className="cleanup-header">
            <h3>🧹 Cleanup Monitoring</h3>
            <div className="cleanup-actions">
              <button 
                onClick={() => performCleanup('general')}
                disabled={cleanupLoading}
                className="cleanup-button general"
              >
                {cleanupLoading ? '🔄 Processing...' : '🧹 Clean General Locations'}
              </button>
              <button 
                onClick={() => performCleanup('all')}
                disabled={cleanupLoading}
                className="cleanup-button all"
              >
                {cleanupLoading ? '🔄 Processing...' : '🗑️ Clean All Expired'}
              </button>
            </div>
          </div>

          {cleanupStats && (
            <div className="cleanup-stats">
              {/* System Health Indicator */}
              {cleanupStats.systemHealth && (
                <div className={`system-health ${cleanupStats.systemHealth.status}`}>
                  <div className="health-header">
                    <span className="health-icon">
                      {cleanupStats.systemHealth.status === 'healthy' ? '✅' : 
                       cleanupStats.systemHealth.status === 'warning' ? '⚠️' : '🚨'}
                    </span>
                    <span className="health-title">System Health</span>
                    <span className={`health-status ${cleanupStats.systemHealth.status}`}>
                      {cleanupStats.systemHealth.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="health-message">{cleanupStats.systemHealth.message}</div>
                  <div className="health-metrics">
                    <span>Quality Ratio: {(cleanupStats.systemHealth.metrics.qualityRatio * 100).toFixed(1)}%</span>
                    <span>Expiring Soon: {cleanupStats.systemHealth.metrics.expiringCount}</span>
                  </div>
                </div>
              )}

              <div className="stats-grid">
                <div className="stat-card">
                  <h4>📊 General Locations (7+ days old)</h4>
                  <div className="stat-value">{cleanupStats.totalGeneralLocationsOlderThan7Days}</div>
                </div>
                <div className="stat-card">
                  <h4>⏰ Expired Locations</h4>
                  <div className="stat-value">{cleanupStats.expiredCount}</div>
                </div>
                <div className="stat-card">
                  <h4>✅ Preserved (2+ points)</h4>
                  <div className="stat-value">{cleanupStats.preservedCount}</div>
                </div>
                <div className="stat-card">
                  <h4>🗑️ To Be Deleted</h4>
                  <div className="stat-value warning">{cleanupStats.toBeDeletedCount}</div>
                </div>
                <div className="stat-card">
                  <h4>⏳ Expiring Soon (24h)</h4>
                  <div className="stat-value">{cleanupStats.expiringSoon}</div>
                </div>
                <div className="stat-card">
                  <h4>📈 Average Points</h4>
                  <div className="stat-value">{cleanupStats.averagePoints.toFixed(1)}</div>
                </div>
                <div className="stat-card">
                  <h4>⭐ High Quality (5+ points)</h4>
                  <div className="stat-value success">{cleanupStats.highQualityLocations}</div>
                </div>
                <div className="stat-card">
                  <h4>⚠️ Low Quality (&lt; 0 points)</h4>
                  <div className="stat-value danger">{cleanupStats.lowQualityLocations}</div>
                </div>
              </div>

              {cleanupStats.expiringSoonDetails.length > 0 && (
                <div className="expiring-soon">
                  <h4>⏰ Locations Expiring Soon</h4>
                  <div className="expiring-list">
                    {cleanupStats.expiringSoonDetails.map(location => (
                      <div key={location.id} className="expiring-item">
                        <span className="location-id">ID: {location.id}</span>
                        <span className="location-type">{location.locationType}</span>
                        <span className="points">Points: {location.totalPoints}</span>
                        <span className="expires-at">
                          Expires: {new Date(location.deleteAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {cleanupHistory.length > 0 && (
            <div className="cleanup-history">
              <h4>📋 Recent Cleanup Operations</h4>
              <div className="history-list">
                {cleanupHistory.slice(0, 10).map(operation => (
                  <div key={operation.id} className="history-item">
                    <div className="history-header">
                      <span className="operation-type">
                        {operation.type === 'general_cleanup' ? '🧹 General Cleanup' : '🗑️ All Locations Cleanup'}
                      </span>
                      <span className="operation-time">
                        {new Date(operation.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="operation-stats">
                      <span>🗑️ Deleted: {operation.deletedCount}</span>
                      {operation.preservedCount !== undefined && (
                        <span>✅ Preserved: {operation.preservedCount}</span>
                      )}
                      <span>📊 Processed: {operation.totalProcessed}</span>
                    </div>
                    {operation.deletedLocationTypes && (
                      <div className="deleted-types">
                        {Object.entries(operation.deletedLocationTypes).map(([type, count]) => (
                          <span key={type} className="type-count">
                            {type}: {count}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {cleanupLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner">🔄 Loading cleanup data...</div>
            </div>
          )}
        </div>
      )}

      {/* Search Section */}
      {activeTab === 'search' && (
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
          <button onClick={() => handleSearch(searchType, searchQuery)} className="search-button">
            Search
          </button>
        </div>
      )}

      {/* Search Results */}
      {activeTab === 'search' && searchResults.length > 0 && (
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
                        onClick={() => handleUserSelect(result.id)}
                        className="view-locations-button"
                      >
                        View Locations
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="location-result">
                    <div className="location-info">
                      <strong>{result.content?.text}</strong>
                      <small>Created: {new Date(result.createdAt).toLocaleDateString()}</small>
                      <div className="location-stats">
                        <span>👍 {result.upvotes || 0}</span>
                        <span>👎 {result.downvotes || 0}</span>
                        <span>📍 {result.verificationStatus}</span>
                        <span>👤 {result.creator?.email}</span>
                      </div>
                      {renderMediaPreview(result.content?.mediaUrls, result.content?.mediaTypes)}
                      <div className="location-actions">
                        <button 
                          onClick={() => handleViewOnMap(result)}
                          className="view-on-map-button"
                        >
                          🌍 View on Map
                        </button>
                        <button 
                          onClick={() => handleDeleteLocation(result.id)}
                          className="delete-button"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Section */}
      {activeTab === 'users' && (
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
                        onClick={() => handleUserSelect(user.id)}
                        className="view-locations-button"
                        title="View user's locations"
                      >
                        View Locations
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="delete-button"
                        disabled={user.isAdmin}
                        title="Delete user"
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
      )}

      {activeTab === 'status' && (
        <div className="status-tab">
          <div className="status-overview">
            <h3>📍 Location Status Overview</h3>
            {statusLoading ? (
              <div>Loading status statistics...</div>
            ) : (
              <div className="status-stats-grid">
                <div className="status-stat-card pending">
                  <div className="stat-icon">⏳</div>
                  <div className="stat-number">{statusStats.pending}</div>
                  <div className="stat-label">Pending</div>
                </div>
                <div className="status-stat-card verified">
                  <div className="stat-icon">✅</div>
                  <div className="stat-number">{statusStats.verified}</div>
                  <div className="stat-label">Verified</div>
                </div>
                <div className="status-stat-card flagged">
                  <div className="stat-icon">🚩</div>
                  <div className="stat-number">{statusStats.flagged}</div>
                  <div className="stat-label">Flagged</div>
                </div>
                <div className="status-stat-card removed">
                  <div className="stat-icon">🗑️</div>
                  <div className="stat-number">{statusStats.removed}</div>
                  <div className="stat-label">Removed</div>
                </div>
                <div className="status-stat-card total">
                  <div className="stat-icon">📊</div>
                  <div className="stat-number">{statusStats.total}</div>
                  <div className="stat-label">Total</div>
                </div>
              </div>
            )}
          </div>

          <div className="status-actions">
            <h4>🔧 Manual Status Management</h4>
            <div className="status-action-buttons">
              <button 
                onClick={() => loadLocationsByStatus('pending')}
                className="status-action-btn pending"
              >
                ⏳ View Pending ({statusStats.pending})
              </button>
              <button 
                onClick={() => loadLocationsByStatus('flagged')}
                className="status-action-btn flagged"
              >
                🚩 View Flagged ({statusStats.flagged})
              </button>
              <button 
                onClick={() => loadLocationsByStatus('verified')}
                className="status-action-btn verified"
              >
                ✅ View Verified ({statusStats.verified})
              </button>
              <button 
                onClick={() => loadLocationsByStatus('removed')}
                className="status-action-btn removed"
              >
                🗑️ View Removed ({statusStats.removed})
              </button>
            </div>
          </div>

          {/* Display locations by status */}
          {Object.entries(locationsByStatus).map(([status, locations]) => (
            <div key={status} className="status-locations-section">
              <h4>
                {status === 'pending' && '⏳'} 
                {status === 'verified' && '✅'} 
                {status === 'flagged' && '🚩'} 
                {status === 'removed' && '🗑️'} 
                {status.charAt(0).toUpperCase() + status.slice(1)} Locations ({locations.length})
              </h4>
              <div className="locations-grid">
                {locations.map(location => (
                  <div key={location.id} className="location-card">
                    <div className="location-header">
                      <span className="location-type">{location.locationType}</span>
                      <span className="location-status">{location.locationStatus}</span>
                    </div>
                    <div className="location-content">
                      <p>{location.content?.text || 'No description'}</p>
                      <div className="location-meta">
                        <span>👍 {location.upvotes || 0}</span>
                        <span>👎 {location.downvotes || 0}</span>
                        <span>📅 {new Date(location.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="location-actions">
                      <button 
                        onClick={() => handleViewOnMap(location)}
                        className="action-btn view"
                      >
                        🗺️ View
                      </button>
                      <select 
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          if (newStatus !== location.locationStatus) {
                            const reason = prompt(`Reason for changing status to ${newStatus}:`);
                            if (reason) {
                              updateLocationStatus(location.id, newStatus, reason);
                            }
                          }
                        }}
                        value={location.locationStatus}
                        className="status-select"
                      >
                        <option value="pending">⏳ Pending</option>
                        <option value="verified">✅ Verified</option>
                        <option value="flagged">🚩 Flagged</option>
                        <option value="removed">🗑️ Removed</option>
                      </select>
                      <button 
                        onClick={() => handleDeleteLocation(location.id)}
                        className="action-btn delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Moderator Review Queue Tab */}
      {activeTab === 'moderator' && (
        <div className="moderator-tab">
          <div className="moderator-header">
            <h3>👮‍♂️ Moderator Review Queue</h3>
            <div className="moderator-stats">
              <div className="stat-item">
                <span className="stat-icon">⏳</span>
                <span className="stat-number">{moderatorStats.pending}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">✅</span>
                <span className="stat-number">{moderatorStats.approved}</span>
                <span className="stat-label">Approved</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">❌</span>
                <span className="stat-number">{moderatorStats.rejected}</span>
                <span className="stat-label">Rejected</span>
              </div>
              <div className="stat-item">
                <span className="stat-icon">📊</span>
                <span className="stat-number">{moderatorStats.total}</span>
                <span className="stat-label">Total</span>
              </div>
            </div>
          </div>

          <div className="moderator-filters">
            <h4>🔍 Filter by Trust Level</h4>
            <div className="filter-buttons">
              <button 
                className={selectedTrustLevel === 'all' ? 'active' : ''}
                onClick={() => {
                  setSelectedTrustLevel('all');
                  loadReviewQueue();
                }}
              >
                All Levels
              </button>
              <button 
                className={selectedTrustLevel === 'new' ? 'active' : ''}
                onClick={() => {
                  setSelectedTrustLevel('new');
                  loadLocationsByTrustLevel('new');
                }}
              >
                🆕 New Users
              </button>
              <button 
                className={selectedTrustLevel === 'trusted' ? 'active' : ''}
                onClick={() => {
                  setSelectedTrustLevel('trusted');
                  loadLocationsByTrustLevel('trusted');
                }}
              >
                ✅ Trusted Users
              </button>
              <button 
                className={selectedTrustLevel === 'verified' ? 'active' : ''}
                onClick={() => {
                  setSelectedTrustLevel('verified');
                  loadLocationsByTrustLevel('verified');
                }}
              >
                🔒 Verified Users
              </button>
            </div>
          </div>

          <div className="review-queue">
            <h4>📋 Pending Review ({reviewQueue.length})</h4>
            {moderatorLoading ? (
              <div className="loading">🔄 Loading review queue...</div>
            ) : reviewQueue.length === 0 ? (
              <div className="empty-queue">
                <div className="empty-icon">✅</div>
                <p>No locations pending review!</p>
                <p className="empty-subtitle">All locations have been processed.</p>
              </div>
            ) : (
              <div className="queue-items">
                {reviewQueue.map(location => (
                  <div key={location.id} className="queue-item">
                    <div className="item-header">
                      <div className="item-info">
                        <span className="location-type">{location.locationType}</span>
                        <span className="creator-info">
                          by {location.creator?.profile?.name || location.creator?.email}
                        </span>
                        <span className="trust-level">
                          {location.creator?.trustLevel || 'new'} trust level
                        </span>
                      </div>
                      <div className="item-date">
                        {new Date(location.createdAt).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="item-content">
                      <p className="location-text">{location.content?.text || 'No description'}</p>
                      {location.content?.mediaUrls && location.content.mediaUrls.length > 0 && (
                        <div className="location-media">
                          {renderMediaPreview(location.content.mediaUrls, location.content.mediaTypes)}
                        </div>
                      )}
                    </div>

                    <div className="item-meta">
                      <div className="meta-stats">
                        <span>📍 {location.location?.coordinates ? 
                          `${location.location.coordinates[1].toFixed(4)}, ${location.location.coordinates[0].toFixed(4)}` : 
                          'No coordinates'}
                        </span>
                        <span>💰 {location.credits || 0} credits</span>
                        <span>⏰ {location.autoDelete ? 
                          `Auto-delete: ${new Date(location.deleteAt).toLocaleDateString()}` : 
                          'No auto-delete'}
                        </span>
                      </div>
                    </div>

                    <div className="item-actions">
                      <button 
                        onClick={() => approveLocation(location.id)}
                        className="action-btn approve"
                        title="Approve this location"
                      >
                        ✅ Approve
                      </button>
                      <button 
                        onClick={() => {
                          const reason = prompt('Reason for rejection:');
                          if (reason) {
                            rejectLocation(location.id, reason);
                          }
                        }}
                        className="action-btn reject"
                        title="Reject this location"
                      >
                        ❌ Reject
                      </button>
                      <button 
                        onClick={() => handleViewOnMap(location)}
                        className="action-btn view"
                        title="View on map"
                      >
                        🗺️ View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
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