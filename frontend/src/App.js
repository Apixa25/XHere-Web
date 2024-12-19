// App.js
import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

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

  const mapStyles = {
    height: "100vh",
    width: "100%"
  };

  const defaultCenter = {
    lat: 40.7128,
    lng: -74.0060
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = isRegistering ? '/api/register' : '/api/login';
    
    try {
      const response = await fetch(endpoint, {
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
          setUser(data.user);
        } else {
          setIsRegistering(false); // Switch to login after successful registration
        }
      } else {
        alert(data.error);
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
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formPayload
      });
      const data = await response.json();
      setLocationData([...locationData, data]);
      setSelectedLocation(null);
      setContentForm({ text: '', media: [] });
    } catch (error) {
      console.error('Error submitting location data:', error);
    }
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

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
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
            center={defaultCenter}
            onClick={handleMapClick}
          >
            {locationData.map(location => (
              <Marker
                key={location._id}
                position={{
                  lat: location.location.coordinates[1],
                  lng: location.location.coordinates[0]
                }}
              />
            ))}
            {selectedLocation && (
              <Marker
                position={selectedLocation}
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                }}
              />
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