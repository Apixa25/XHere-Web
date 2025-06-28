import React, { useState, useEffect } from 'react';
import api from '../services/api';
import LocationCard from './shared/LocationCard';
import '../styles/OfficialLocationsPage.css';

const OfficialLocationsPage = () => {
  const [officialLocations, setOfficialLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('all');

  useEffect(() => {
    fetchOfficialLocations();
    fetchStats();
  }, []);

  const fetchOfficialLocations = async () => {
    try {
      setLoading(true);
      const response = await api.getOfficialLocations({ limit: 50 });
      console.log('Official locations API response:', response);
      // Axios returns the data directly
      if (response && (response.success === undefined || response.success === true)) {
        // If response.success is undefined, assume success (backend may not send it)
        setOfficialLocations(response.locations || response);
      } else {
        setError('Failed to load official locations');
      }
    } catch (error) {
      console.error('Error fetching official locations:', error);
      setError('Failed to load official locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getOfficialLocationStats();
      console.log('Official location stats API response:', response);
      if (response && (response.success === undefined || response.success === true)) {
        setStats(response.stats || response);
      }
    } catch (error) {
      console.error('Error fetching official location stats:', error);
    }
  };

  const filteredLocations = officialLocations.filter(location => {
    const matchesSearch = location.content?.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (location.keywords || []).some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = locationTypeFilter === 'all' || location.locationType === locationTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleLocationUpdate = (updatedLocation) => {
    setOfficialLocations(prev => 
      prev.map(loc => loc.id === updatedLocation.id ? updatedLocation : loc)
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '24px', color: '#666' }}>🔵 Loading Official Locations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '24px', color: '#f44336' }}>❌ {error}</div>
        <button 
          onClick={fetchOfficialLocations}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="official-locations-page">
      {/* Header */}
      <div className="official-locations-header">
        <h1>🔵 Official Locations</h1>
        <p>Verified locations with blue checkmarks and protected boundaries</p>
        
        {/* Stats */}
        {stats && (
          <div className="official-stats">
            <div className="stat-item">
              <span className="stat-number">{stats.totalOfficial}</span>
              <span className="stat-label">Official Locations</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{stats.officialPercentage}%</span>
              <span className="stat-label">of Total Locations</span>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="official-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search official locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-container">
          <select
            value={locationTypeFilter}
            onChange={(e) => setLocationTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="yard_sale">Yard Sale</option>
            <option value="crime">Crime</option>
            <option value="interesting">Interesting</option>
            <option value="event">Event</option>
            <option value="market">Market</option>
            <option value="food_truck">Food Truck</option>
            <option value="church">Church</option>
            <option value="historical">Historical</option>
            <option value="for_sale">For Sale</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="official-results">
        {filteredLocations.length === 0 ? (
          <div className="no-results">
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
              {searchTerm || locationTypeFilter !== 'all' 
                ? 'No official locations match your filters' 
                : 'No official locations found'}
            </div>
            <p style={{ color: '#999' }}>
              Official locations are verified with blue checkmarks and have 150-foot protected boundaries.
            </p>
          </div>
        ) : (
          <>
            <div className="results-count">
              Showing {filteredLocations.length} official location{filteredLocations.length !== 1 ? 's' : ''}
            </div>
            
            <div className="locations-grid">
              {filteredLocations.map(location => (
                <LocationCard
                  key={location.id}
                  location={location}
                  onLocationUpdate={handleLocationUpdate}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Back to Map Button */}
      <div className="back-to-map">
        <button
          onClick={() => window.history.back()}
          className="back-button"
        >
          ← Back to Map
        </button>
      </div>
    </div>
  );
};

export default OfficialLocationsPage; 