// App.js
import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, InfoWindow, useGoogleMap } from '@react-google-maps/api';

// Replace the AdvancedMarker component with a simpler Marker component
const Marker = ({ position, onClick }) => {
  const [marker, setMarker] = useState(null);
  const map = useGoogleMap();

  useEffect(() => {
    if (map && window.google) {
      const newMarker = new window.google.maps.Marker({
        position,
        map
      });

      if (onClick) {
        newMarker.addListener('click', onClick);
      }

      setMarker(newMarker);

      return () => {
        if (newMarker) {
          newMarker.setMap(null);
        }
      };
    }
  }, [map, position, onClick]);

  return null;
};

// Add this constant outside of the App component
const LIBRARIES = ['places'];

function App() {
  const [user, setUser] = useState(null); // Track logged in user
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between login/register
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

  const mapStyles = {
    height: "100vh",
    width: "100%"
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    
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
          // For login success
          localStorage.setItem('token', data.token);
          setUser({ email: formData.email }); // Set some user data
          console.log('Login successful!');
        } else {
          // For registration success
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
    if (!user) return; // Only allow logged in users to add locations
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

    try {
      const response = await fetch('http://localhost:3000/api/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formPayload
      });
      await response.json();
      fetchLocations();
      setSelectedLocation(null);
      setContentForm({ text: '', media: [] });
    } catch (error) {
      console.error('Error submitting location data:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/locations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setLocationData(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLocations();
    }
  }, [user]);

  // Load marker library when map is ready
  const handleMapLoad = (map) => {
    setMapInstance(map);
  };

  // If user is not logged in, show auth form
  if (!user) {
    return (
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
  }

  console.log('Map ID:', process.env.REACT_APP_GOOGLE_MAPS_MAP_ID);

  return (
    <LoadScript 
      googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
      libraries={LIBRARIES}
    >
      <div className="app">
        <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1 }}>
          <button onClick={() => {
            localStorage.removeItem('token');
            setUser(null);
          }}>Logout</button>
        </div>
        
        <div className="map-container">
          <GoogleMap
            mapContainerStyle={mapStyles}
            zoom={13}
            center={mapCenter}
            onClick={handleMapClick}
            mapId={process.env.REACT_APP_GOOGLE_MAPS_MAP_ID}
            options={{
              mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID
            }}
            onLoad={handleMapLoad}
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
            {mapInstance && locationData.map(location => (
              <Marker
                key={location._id}
                position={{
                  lat: parseFloat(location.location.coordinates[1]),
                  lng: parseFloat(location.location.coordinates[0])
                }}
                onClick={() => setSelectedMarker(location)}
              />
            ))}

            {mapInstance && selectedLocation && (
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
                  <p><strong>Posted by:</strong> {selectedMarker.creator.profile.name || selectedMarker.creator.email}</p>
                  <p>{selectedMarker.content.text}</p>
                  {selectedMarker.content.mediaUrls.map((url, index) => (
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
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
        
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
    </LoadScript>
  );
}

export default App;