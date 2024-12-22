// App.js
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { GoogleMap, useLoadScript, InfoWindow, Marker } from '@react-google-maps/api';
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';

const LIBRARIES = ['places'];

// Create a context for Google Maps
const GoogleMapsContext = createContext(null);

function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  if (loadError) {
    console.error('Error loading maps:', loadError);
    return <div>Error loading maps</div>;
  }

  if (!isLoaded) {
    return <div>Loading maps...</div>;
  }

  return children;
}

// Add this new component at the top of your file, outside the App component
function LocationInfoWindow({ selectedLocation, selectedMarker, onClose, onSubmit, contentForm, setContentForm, user, handleDeleteLocation }) {
  if (selectedLocation) {
    return (
      <InfoWindow
        position={selectedLocation}
        onCloseClick={() => onClose('location')}
      >
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            text: contentForm.text,
            media: contentForm.media,
            isAnonymous: contentForm.isAnonymous
          });
        }}>
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
            onChange={(e) => {
              const files = Array.from(e.target.files);
              setContentForm({ ...contentForm, media: files });
            }}
            style={{ marginBottom: '10px' }}
          />
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '10px' 
          }}>
            <input
              type="checkbox"
              id="anonymous"
              checked={contentForm.isAnonymous}
              onChange={e => setContentForm({ 
                ...contentForm, 
                isAnonymous: e.target.checked 
              })}
              style={{ marginRight: '8px' }}
            />
            <label htmlFor="anonymous" style={{ fontSize: '14px', color: '#666' }}>
              Post anonymously
            </label>
          </div>
          <button type="submit" style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            width: '100%'
          }}>
            Save Location
          </button>
        </form>
      </InfoWindow>
    );
  }

  if (selectedMarker) {
    return (
      <InfoWindow
        position={{
          lat: selectedMarker.location.coordinates[1],
          lng: selectedMarker.location.coordinates[0]
        }}
        onCloseClick={() => onClose('marker')}
      >
        <div>
          {console.log('Marker data:', selectedMarker)}
          <p style={{ 
            fontSize: '14px', 
            color: '#666', 
            marginBottom: '8px',
            fontStyle: 'italic'
          }}>
            {selectedMarker.content.isAnonymous === true ? 
              'Posted anonymously' : 
              `Posted by: ${selectedMarker.creator?.profile?.name || 'Unknown User'}`
            }
          </p>
          <p style={{ marginBottom: '10px' }}>{selectedMarker.content.text}</p>
          {selectedMarker.content.mediaUrls && selectedMarker.content.mediaUrls.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              {selectedMarker.content.mediaUrls.map((url, index) => {
                const mediaType = selectedMarker.content.mediaTypes[index];
                if (mediaType.startsWith('video/')) {
                  return (
                    <video
                      key={index}
                      controls
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        marginBottom: '10px'
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
                        maxHeight: '200px',
                        objectFit: 'cover',
                        marginBottom: '10px',
                        borderRadius: '4px'
                      }}
                    />
                  );
                }
              })}
            </div>
          )}
          {user && selectedMarker.creator && user.userId === selectedMarker.creator._id && (
            <button
              onClick={() => handleDeleteLocation(selectedMarker._id)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%',
                marginTop: '10px'
              }}
            >
              Delete Location
            </button>
          )}
        </div>
      </InfoWindow>
    );
  }

  return null;
}

function App() {
  const [user, setUser] = useState(() => {
    // Check localStorage for user data when app initializes
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
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
    media: [],
    isAnonymous: false
  });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [map, setMap] = useState(null);
  const [mapCenter] = useState({
    lat: 40.7128,
    lng: -74.0060
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const [error, setError] = useState(null);

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
          const userData = { 
            email: data.user.email,
            userId: data.user._id.toString()
          };
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(userData)); // Save user data
          setUser(userData);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // Remove user data
    setUser(null);
  };

  const handleMapClick = (event) => {
    if (!user) return;
    
    // Only set selectedLocation if we're clicking on the map (not a marker)
    if (!event.placeId) {
      const clickedLat = event.latLng.lat();
      const clickedLng = event.latLng.lng();
      
      setSelectedLocation({
        lat: clickedLat,
        lng: clickedLng
      });
      setSelectedMarker(null); // Close any open marker info windows
    }
  };

  const handleMarkerClick = (location) => {
    console.log("Marker clicked:", location); // Debug log
    setSelectedMarker(location);
    setSelectedLocation(null); // Close any new location form
  };

  const handleLocationSubmit = async (data) => {
    try {
      console.log('Submitting location with data:', data);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('latitude', data.lat);
      formData.append('longitude', data.lng);
      formData.append('text', data.text);
      formData.append('isAnonymous', data.isAnonymous.toString());
      
      // Append media files if any
      if (data.media) {
        data.media.forEach(file => {
          formData.append('media', file);
        });
      }

      const response = await fetch('http://localhost:3000/api/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const newLocation = await response.json();
      console.log('Location created successfully:', newLocation);
      
      // Update your locations state or handle success
      setLocationData([...locationData, newLocation]);
      setContentForm({ text: '', media: [], isAnonymous: false });
      setSelectedLocation(null);
      setSelectedMarker(null);
    } catch (err) {
      console.error('Error submitting location data:', err);
      setError(err.message);
    }
  };

  const fetchLocations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/locations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      setLocationData(data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  }, []);

  useEffect(() => {
    console.log('LocationData updated:', locationData);
  }, [locationData]);

  const handleMapLoad = (mapInstance) => {
    console.log('Map loaded successfully');
    setMap(mapInstance);
  };

  const handleMapUnmount = () => {
    try {
      console.log('Map unmounting');
      setMap(null);
    } catch (error) {
      console.error('Error unmounting map:', error);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove the deleted location from state
        setLocationData(prevLocations => 
          prevLocations.filter(loc => loc._id !== locationId)
        );
        setSelectedMarker(null);
      } else {
        console.error('Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
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

  // Only render the map when user is logged in
  if (!user) {
    return renderAuthForm();
  }

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
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
              onClick={handleLogout}
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

          <div className="map-container">
            <GoogleMap
              mapContainerStyle={mapStyles}
              zoom={13}
              center={mapCenter}
              onClick={handleMapClick}
              onLoad={handleMapLoad}
              onUnmount={handleMapUnmount}
              options={{
                disableDefaultUI: true,
                clickableIcons: false,
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false
              }}
            >
              {/* Existing markers */}
              {locationData.map(location => (
                <Marker
                  key={location._id}
                  position={{
                    lat: location.location.coordinates[1],
                    lng: location.location.coordinates[0]
                  }}
                  onClick={() => handleMarkerClick(location)}
                />
              ))}

              {/* Single InfoWindow component */}
              <LocationInfoWindow
                selectedLocation={selectedLocation}
                selectedMarker={selectedMarker}
                onClose={(type) => {
                  if (type === 'marker') {
                    setSelectedMarker(null);
                  } else {
                    setSelectedLocation(null);
                  }
                }}
                onSubmit={handleLocationSubmit}
                contentForm={contentForm}
                setContentForm={setContentForm}
                user={user}
                handleDeleteLocation={handleDeleteLocation}
              />
            </GoogleMap>
          </div>
        </div>
      )
    },
    {
      path: "/profile",
      element: <ProfilePage 
        user={user} 
        onLocationUpdate={fetchLocations}
      />
    }
  ]);

  console.log('States:', { selectedMarker, selectedLocation });

  console.log('Render App:', { 
    selectedMarker: selectedMarker ? selectedMarker._id : null,
    selectedLocation: selectedLocation,
    routerPath: window.location.pathname 
  });

  return (
    <ErrorBoundary>
      <GoogleMapsProvider>
        <RouterProvider router={router} />
      </GoogleMapsProvider>
    </ErrorBoundary>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with the map. Please refresh the page.</div>;
    }

    return this.props.children;
  }
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}