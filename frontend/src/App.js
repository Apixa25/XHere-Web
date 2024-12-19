// App.js
import React, { useState, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

function App() {
  const [user, setUser] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationData, setLocationData] = useState([]);
  const [formData, setFormData] = useState({
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

  const handleMapClick = (event) => {
    setSelectedLocation({
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLocation) return;

    const formPayload = new FormData();
    formPayload.append('latitude', selectedLocation.lat);
    formPayload.append('longitude', selectedLocation.lng);
    formPayload.append('text', formData.text);
    formData.media.forEach(file => {
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
      setFormData({ text: '', media: [] });
    } catch (error) {
      console.error('Error submitting location data:', error);
    }
  };

  return (
    <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <div className="app">
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
          <div className="location-form">
            <form onSubmit={handleSubmit}>
              <textarea
                value={formData.text}
                onChange={e => setFormData({ ...formData, text: e.target.value })}
                placeholder="Enter location description"
              />
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={e => setFormData({ ...formData, media: Array.from(e.target.files) })}
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