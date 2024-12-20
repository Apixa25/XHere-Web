// App.js
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, InfoWindow, Marker } from '@react-google-maps/api';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';
import MapErrorBoundary from './components/MapErrorBoundary';

const LIBRARIES = ['places'];

function App() {
  const [user, setUser] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationData, setLocationData] = useState([]);
  const [contentForm, setContentForm] = useState({
    text: '',
    media: []
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapCenter, setMapCenter] = useState({
    lat: 40.7128,
    lng: -74.0060
  });
  const [isLoaded, setIsLoaded] = useState(false);

  const mapStyles = {
    height: "100vh",
    width: "100%"
  };

  // Fetch locations when user changes
  useEffect(() => {
    if (user) {
      fetchLocations();
    }
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (!isRegistering) {
          localStorage.setItem('token', data.token);
          setUser({ 
            email: data.user.email,
            userId: data.user._id.toString()
          });
          console.log('Login successful!');
        } else {
          setIsRegistering(false);
          alert('Registration successful! Please login.');
        }
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed');
    }
  };

  const handleMapClick = (event) => {
    if (!user) return;
    setSelectedLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    });
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation || !user) return;

    const formPayload = new FormData();
    formPayload.append('latitude', selectedLocation.lat);
    formPayload.append('longitude', selectedLocation.lng);
    formPayload.append('text', contentForm.text);
    contentForm.media.forEach(file => {
      formPayload.append('media', file);
    });

    console.log('Submitting location:', {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      text: contentForm.text,
      mediaCount: contentForm.media.length
    });

    try {
      const response = await fetch('http://localhost:3000/api/user/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formPayload
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Location created:', data);
      await fetchLocations();
      console.log('Updated locations:', locationData);
      setSelectedLocation(null);
      setContentForm({ text: '', media: [] });
    } catch (error) {
      console.error('Error submitting location data:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/user/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setLocationData(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  const handleMapUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  const handleDeleteLocation = async (locationId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setSelectedMarker(null);
        fetchLocations();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location');
    }
  };

  const renderAuthForm = () => (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleAuth}>
        {isRegistering && (
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
        )}
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
        </div>
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        <button type="button" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </button>
      </form>
    </div>
  );

  if (!user) {
    return renderAuthForm();
  }

  return (
    <Router>
      <LoadScript 
        googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
        libraries={LIBRARIES}
        version="weekly"
        onLoad={() => setIsLoaded(true)}
        onError={(error) => console.error('Script loading error:', error)}
        loadingElement={<div>Loading...</div>}
      >
        {isLoaded && (
          <div className="app">
            <div style={{ 
              position: 'absolute', 
              top: '10px', 
              right: '10px', 
              zIndex: 1,
              display: 'flex',
              gap: '10px',
              background: 'white',
              padding: '10px',
              borderRadius: '5px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
              <Link to="/profile">
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>Profile</button>
              </Link>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  setUser(null);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >Logout</button>
            </div>

            <Routes>
              <Route path="/profile" element={<ProfilePage user={user} />} />
              <Route path="/" element={
                <MapErrorBoundary>
                  <div className="map-container">
                    <GoogleMap
                      mapContainerStyle={mapStyles}
                      zoom={13}
                      center={mapCenter}
                      onClick={handleMapClick}
                      onLoad={handleMapLoad}
                      onUnmount={handleMapUnmount}
                      onDragEnd={() => {
                        if (mapInstance) {
                          const newCenter = mapInstance.getCenter();
                          setMapCenter({
                            lat: newCenter.lat(),
                            lng: newCenter.lng()
                          });
                        }
                      }}
                    >
                      {locationData.map(location => {
                        console.log('Rendering marker:', location);
                        return (
                          <Marker
                            key={location._id}
                            position={{
                              lat: parseFloat(location.location.coordinates[1]),
                              lng: parseFloat(location.location.coordinates[0])
                            }}
                            onClick={() => setSelectedMarker(location)}
                          />
                        );
                      })}
                      {selectedLocation && (
                        <Marker
                          position={selectedLocation}
                        />
                      )}
                      {selectedMarker && (
                        <InfoWindow
                          position={{
                            lat: selectedMarker.location.coordinates[1],
                            lng: selectedMarker.location.coordinates[0]
                          }}
                          onCloseClick={() => setSelectedMarker(null)}
                        >
                          <div style={{ maxWidth: '200px' }}>
                            <p><strong>Posted by:</strong> {selectedMarker.creator.profile?.name || selectedMarker.creator.email}</p>
                            <p>{selectedMarker.content.text}</p>
                            {selectedMarker.content.mediaUrls?.map((url, index) => (
                              selectedMarker.content.mediaTypes[index].startsWith('image') ? (
                                <img 
                                  key={index}
                                  src={`http://localhost:3000/${url}`}
                                  alt="Location media"
                                  style={{ maxWidth: '100%', marginTop: '8px' }}
                                />
                              ) : (
                                <video 
                                  key={index}
                                  src={`http://localhost:3000/${url}`}
                                  controls
                                  style={{ maxWidth: '100%', marginTop: '8px' }}
                                />
                              )
                            ))}
                            {user && selectedMarker.creator._id.toString() === user.userId && (
                              <button 
                                onClick={() => handleDeleteLocation(selectedMarker._id)}
                                style={{ 
                                  marginTop: '10px',
                                  backgroundColor: '#ff4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: '5px 10px',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete Location
                              </button>
                            )}
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </div>
                </MapErrorBoundary>
              } />
            </Routes>

            {selectedLocation && (
              <div style={{ 
                position: 'absolute', 
                bottom: '20px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}>
                <form onSubmit={handleLocationSubmit}>
                  <textarea
                    value={contentForm.text}
                    onChange={e => setContentForm({ ...contentForm, text: e.target.value })}
                    placeholder="Enter location description"
                    style={{ width: '100%', marginBottom: '10px' }}
                  />
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={e => setContentForm({ ...contentForm, media: Array.from(e.target.files) })}
                  />
                  <button type="submit">Save Location Data</button>
                </form>
              </div>
            )}
          </div>
        )}
      </LoadScript>
    </Router>
  );
}

export default App;