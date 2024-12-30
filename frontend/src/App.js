// App.js
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { GoogleMap, useLoadScript, InfoWindow, Marker } from '@react-google-maps/api';
import { createBrowserRouter, RouterProvider, Link } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';
import { GoogleOAuthProvider } from '@react-oauth/google';

const LIBRARIES = ['places'];

// Create a context for Google Maps
const GoogleMapsContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

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
function LocationInfoWindow({ 
  selectedLocation, 
  selectedMarker, 
  onClose, 
  onSubmit, 
  contentForm, 
  setContentForm, 
  user, 
  handleDeleteLocation,
  setSelectedMarker
}) {
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
                      <source src={`${API_URL}/${url}`} type={mediaType} />
                      Your browser does not support the video tag.
                    </video>
                  );
                } else {
                  return (
                    <img
                      key={index}
                      src={`${API_URL}/${url}`}
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
          {user && (user.isAdmin || (selectedMarker.creator && user.userId === selectedMarker.creator._id)) && (
            <button
              onClick={() => handleDeleteLocation(selectedMarker.id)}
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

  console.log('Google Client ID:', process.env.REACT_APP_GOOGLE_CLIENT_ID);

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
    try {
      const endpoint = isRegistering ? 'auth/register' : 'auth/login';
      
      // Create the appropriate request body based on the endpoint
      const requestBody = isRegistering 
        ? { 
            email: formData.email,
            password: formData.password,
            name: formData.name 
          }
        : { 
            email: formData.email,
            password: formData.password 
          };

      console.log(`Attempting ${isRegistering ? 'registration' : 'login'} with:`, {
        ...requestBody,
        password: '[REDACTED]'
      });

      console.log('Making request to:', `${API_URL}/api/${endpoint}`);

      const response = await fetch(`${API_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Store the token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      // Clear form after successful auth
      setFormData({
        email: '',
        password: '',
        name: ''
      });
      
    } catch (error) {
      console.error('Auth error:', error);
      alert(error.message || 'Authentication failed');
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
    console.log('Clicked location full data:', JSON.stringify(location, null, 2));
    console.log('Media URLs:', location.content.mediaUrls);
    console.log("Marker clicked:", location); // Debug log
    setSelectedMarker(location);
    setSelectedLocation(null); // Close any new location form
  };

  const handleLocationSubmit = async (data) => {
    try {
      console.log('Submitting location with data:', data);
      
      const formData = new FormData();
      formData.append('latitude', data.lat);
      formData.append('longitude', data.lng);
      formData.append('text', data.text || '');
      formData.append('isAnonymous', data.isAnonymous || false);
      
      if (data.media && data.media.length > 0) {
        data.media.forEach(file => {
          formData.append('media', file);
        });
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/locations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create location');
      }

      const newLocation = await response.json();
      console.log('Location created successfully:', newLocation);
      
      // Transform the location data to match expected format
      const transformedLocation = {
        id: newLocation.id,
        location: {
          type: 'Point',
          coordinates: [
            parseFloat(data.lng),
            parseFloat(data.lat)
          ]
        },
        content: {
          text: data.text,
          mediaUrls: newLocation.content?.mediaUrls || [],
          mediaTypes: newLocation.content?.mediaTypes || [],
          isAnonymous: data.isAnonymous
        },
        creator: newLocation.creator,
        createdAt: newLocation.createdAt,
        updatedAt: newLocation.updatedAt
      };

      // Update locations state and refetch to ensure we have the latest data
      setLocationData(prevLocations => [...prevLocations, transformedLocation]);
      await fetchLocations();
      
      // Reset form and selected states
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
      const response = await fetch(`${API_URL}/api/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch locations');
      }

      const data = await response.json();
      console.log('Fetched locations:', data);
      
      if (Array.isArray(data)) {
        setLocationData(data);
      } else {
        console.error('Received non-array data:', data);
        setLocationData([]);
      }
    } catch (err) {
      console.error('Error fetching locations:', err);
      setLocationData([]);
    }
  }, []);

  useEffect(() => {
    if (user) {
      console.log('Fetching locations for user:', user);
      fetchLocations();
    }
  }, [user, fetchLocations]);

  useEffect(() => {
    console.log('LocationData updated:', locationData);
    console.log('LocationData type:', Array.isArray(locationData) ? 'array' : typeof locationData);
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
      console.log('Attempting to delete location:', locationId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete location');
      }

      // Update state only after successful deletion
      setLocationData(prevLocations => 
        prevLocations.filter(loc => loc.id !== locationId)
      );
      setSelectedMarker(null);
    } catch (error) {
      console.error('Error deleting location:', error);
      // Optionally show error to user
      alert(error.message || 'Failed to delete location');
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
              required={isRegistering}
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
        <button type="button" onClick={() => {
          setIsRegistering(!isRegistering);
          setFormData({ email: '', password: '', name: '' }); // Clear form when switching
        }}>
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
              {locationData.map(location => {
                // Add safety checks for location data
                if (!location?.location?.coordinates) {
                  console.warn('Invalid location data:', location);
                  return null;
                }
                
                return (
                  <Marker
                    key={location.id || location._id}
                    position={{
                      lat: location.location.coordinates[1],
                      lng: location.location.coordinates[0]
                    }}
                    onClick={() => handleMarkerClick(location)}
                  />
                );
              })}

              {/* Single InfoWindow component */}
              {(selectedLocation || selectedMarker) && (
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
                  setSelectedMarker={setSelectedMarker}
                />
              )}
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
        isRegistering={isRegistering}
        handleAuth={handleAuth}
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
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <GoogleMapsProvider>
          <RouterProvider router={router} />
        </GoogleMapsProvider>
      </GoogleOAuthProvider>
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