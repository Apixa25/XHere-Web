import React, { useState, useEffect, useCallback, useRef, createContext, useMemo } from 'react';
import { 
  GoogleMap, 
  LoadScript, 
  Marker,
  InfoWindow,
  useLoadScript 
} from '@react-google-maps/api';
import api from './services/api';
import './App.css';
import BadgeNotification from './components/BadgeNotification';
import VoteButtons from './components/VoteButtons';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { createBrowserRouter, RouterProvider, Link, Navigate } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';
import AuthPage from './components/AuthPage';
import backgroundImage from './images/background.jpg';
import './styles/LocationForm.css';
import AdminDashboard from './components/admin/AdminDashboard';
import './styles/markers.css';
import PROFILE_TYPES from './constants/profileTypes';

const LIBRARIES = ['places', 'marker'];

// Create a context for Google Maps
const GoogleMapsContext = createContext(null);

const getApiUrl = () => {
  // Check if we're running in a mobile environment
  if (window.Capacitor) {
    // For Android emulator
    if (window.Capacitor.getPlatform() === 'android') {
      // Replace this with your actual IP address
      const localIp = '192.168.1.1'; // Replace with your actual IP
      return `http://${localIp}:3000`;
    }
    // For iOS simulator
    if (window.Capacitor.getPlatform() === 'ios') {
      return 'http://localhost:3000';
    }
  }
  // For web environment
  return process.env.REACT_APP_API_URL || 'http://localhost:3000';
};

const API_URL = getApiUrl();

// Add a fetch wrapper with retry logic and better error handling
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  let lastError = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`Attempt ${i + 1} of ${maxRetries} to connect to ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`Successfully connected to ${url}`);
        return response;
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Request failed');
      
    } catch (error) {
      console.log(`Attempt ${i + 1} failed:`, error.message);
      lastError = error;
      
      if (i < maxRetries - 1) {
        console.log(`Waiting 1 second before retry...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw lastError || new Error('All connection attempts failed');
};

const defaultCenter = {
  lat: 41.7555,
  lng: -124.2025
};

const FORCE_ADVANCED_MARKER = true; // Temporary override for testing

console.log('Environment Variables:', {
  useAdvancedMarker: process.env.REACT_APP_USE_ADVANCED_MARKER,
  isTrue: process.env.REACT_APP_USE_ADVANCED_MARKER === 'true',
  typeOf: typeof process.env.REACT_APP_USE_ADVANCED_MARKER,
  rawValue: process.env.REACT_APP_USE_ADVANCED_MARKER
});

const USE_ADVANCED_MARKER = String(process.env.REACT_APP_USE_ADVANCED_MARKER).toLowerCase() === 'true';

const MAPS_ID = process.env.REACT_APP_GOOGLE_MAPS_MAP_ID;

console.log('Map Configuration:', {
  mapId: MAPS_ID,
  hasMapId: !!MAPS_ID,
  apiKey: !!process.env.REACT_APP_GOOGLE_MAPS_API_KEY
});

console.log('Advanced Marker Status:', {
  isAvailable: typeof AdvancedMarkerElement !== 'undefined',
  mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID
});

// Add this helper function before your App component
const getUserFromStorage = () => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  
  if (token && storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
  return null;
};

function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    mapIds: ['51948ac5ec373e9c']
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

function App() {
  const [user, setUser] = useState(getUserFromStorage());
  const [isUserComplete, setIsUserComplete] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [locationData, setLocationData] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [routerPath, setRouterPath] = useState('/');
  const [submitting, setSubmitting] = useState(false);
  const [contentForm, setContentForm] = useState({
    text: '',
    media: [],
    isAnonymous: false,
    autoDelete: false,
    deleteTime: 0,
    deleteUnit: 'minutes'
  });

  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [advancedMarkersAvailable, setAdvancedMarkersAvailable] = useState(false);
  const markersRef = useRef([]);
  const mapRef = useRef(null);
  const advancedMarkerRefs = useRef([]);

  const mapStyles = {
    height: "100vh",
    width: "100%"
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      console.log('🔍 Token verification - Token exists:', !!token);
      
      if (token) {
        try {
          console.log('🔍 Attempting to verify token with API...');
          const response = await fetch('http://localhost:3000/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('🔍 Token verification response status:', response.status);
          
          if (!response.ok) {
            throw new Error('Token verification failed');
          }
          
          const userData = await response.json();
          console.log('🔍 Token verification successful, user data:', userData);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        console.log('🔍 No token found in localStorage');
      }
    };

    verifyToken();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegistering ? 'auth/register' : 'auth/login';
      
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

      console.log('Current environment:', {
        isCapacitor: !!window.Capacitor,
        platform: window.Capacitor?.getPlatform(),
        apiUrl: API_URL,
        userAgent: navigator.userAgent
      });

      const response = await fetchWithRetry(`${API_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Authentication failed');
      }

      const data = await response.json();
      console.log('Server response:', data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      
      setFormData({
        email: '',
        password: '',
        name: ''
      });
      
    } catch (error) {
      console.error('Auth error:', error);
      console.error('Connection details:', {
        apiUrl: API_URL,
        isCapacitor: !!window.Capacitor,
        platform: window.Capacitor?.getPlatform(),
        userAgent: navigator.userAgent
      });
      
      let errorMessage = 'Authentication failed. ';
      if (error.name === 'AbortError') {
        errorMessage += 'Connection timed out. Please check if the server is running and accessible.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Could not connect to the server. Please check your network connection and make sure the server is running.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleVoteUpdate = async (updatedLocation) => {
    // Update the location in locationData
    setLocationData(prevLocations => prevLocations.map(loc => 
      loc.id === updatedLocation.id ? { ...loc, ...updatedLocation } : loc
    ));

    // Update the selectedMarker if it's the same location
    setSelectedMarker(prevMarker => 
      prevMarker?.id === updatedLocation.id 
        ? { ...prevMarker, ...updatedLocation }
        : prevMarker
    );

    // Check for new badges
    try {
      const { newBadges } = await api.checkBadges();
      if (newBadges && newBadges.length > 0) {
        setNewBadges(newBadges);
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  const handleMapClick = async (e) => {
    if (!user) return;
    
    // Only set selectedLocation if we're clicking on the map (not a marker)
    if (!e.placeId) {
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();
      
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

  const handleLocationSubmit = async (formData) => {
    console.log('Form submission data:', formData);
    try {
      setSubmitting(true);
      
      const data = new FormData();
      data.append('latitude', formData.lat);
      data.append('longitude', formData.lng);
      data.append('text', formData.text);
      data.append('isAnonymous', formData.isAnonymous);
      data.append('autoDelete', formData.autoDelete || false);
      if (formData.autoDelete) {
        data.append('deleteTime', formData.deleteTime);
        data.append('deleteUnit', formData.deleteUnit);
      }
      // Add this line to include credits
      data.append('creditAmount', formData.creditAmount || 0);
      
      if (formData.media) {
        formData.media.forEach(file => {
          data.append('media', file);
        });
      }

      const response = await api.addLocation(data);
      console.log('Location created successfully:', response);
      
      // Reset form
      setContentForm({
        text: '',
        media: [],
        isAnonymous: false,
        autoDelete: false,
        deleteTime: 0,
        deleteUnit: 'minutes'
      });
      
      setSelectedLocation(null);
      await fetchLocations();
      
    } catch (error) {
      console.error('Error submitting location data:', error);
      setError('Failed to submit location');
    } finally {
      setSubmitting(false);
    }
  };

  const inspectLocation = (loc) => {
    try {
      return {
        id: loc.id || 'no-id',
        lat: Number(loc.location?.coordinates?.[1]).toFixed(6),
        lng: Number(loc.location?.coordinates?.[0]).toFixed(6),
        text: (loc.content?.text || '').substring(0, 30) + '...',
        creator: loc.creator?.email || 'no-creator',
        raw_location: JSON.stringify(loc.location || {})
      };
    } catch (error) {
      console.error('Error inspecting location:', error, loc);
      return { error: 'Invalid location data', raw: JSON.stringify(loc) };
    }
  };

  useEffect(() => {
    console.log('LocationData updated:', locationData);
    console.log('LocationData type:', Array.isArray(locationData) ? 'array' : typeof locationData);
  }, [locationData]);

  const handleMapLoad = (mapInstance) => {
    try {
      console.log('Map loaded successfully');
      mapRef.current = mapInstance;
      setMap(mapInstance);
    } catch (error) {
      console.error('Error loading map:', error);
    }
  };

  const handleMapUnmount = useCallback(() => {
    console.log('Map unmounting, cleaning up markers');
    // Clear listeners and markers
    advancedMarkerRefs.current.forEach(({ marker, listeners }) => {
      listeners.forEach(listener => listener.remove());
    });
    advancedMarkerRefs.current = [];
    setMap(null);
  }, []);

  useEffect(() => {
    if (!map || !locationData.length || !window.google?.maps?.marker?.AdvancedMarkerElement) {
      return;
    }

    // Clear previous markers
    advancedMarkerRefs.current.forEach(({ marker }) => {
      marker.map = null; // Remove marker from map
    });
    advancedMarkerRefs.current = [];

    console.log('Creating advanced markers for locations:', locationData.length);

    locationData.forEach((location) => {
      const position = {
        lat: Number(location.location?.coordinates?.[1]),
        lng: Number(location.location?.coordinates?.[0]),
      };
      if (!position.lat || !position.lng) {
        console.warn('Invalid position for location:', location.id);
        return;
      }

      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';
      
      const shortText = location.content?.text?.substring(0, 25) + 
        (location.content?.text?.length > 25 ? '...' : '');
      
      markerElement.innerHTML = `
        <div class="marker-content" ${location.content?.isAnonymous ? 'data-anonymous="true"' : ''}>
          ${getProfileImage(location) 
            ? `<img class="marker-profile-pic ${location.content?.isAnonymous ? 'anonymous' : ''}" 
                   src="${getProfileImage(location)}" 
                   alt="${location.content?.isAnonymous ? 'Anonymous User' : 'Profile'}" />` 
            : '<div class="marker-profile-placeholder">👤</div>'
          }
          <div class="marker-text">${shortText}</div>
          <div class="marker-stats">
            <span class="votes">⬆️ ${location.upvotes || 0}</span>
            ${location.credits ? `<span class="credits">✨ ${location.credits}</span>` : ''}
          </div>
        </div>
      `;

      const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: markerElement,
        title: location.content?.text || 'Location'
      });

      const clickListener = advancedMarker.addListener('gmp-click', () => {
        handleMarkerClick(location);
        markerElement.classList.add('bounce');
        setTimeout(() => markerElement.classList.remove('bounce'), 1000);
      });
      
      advancedMarkerRefs.current.push({
        marker: advancedMarker,
        listeners: [clickListener]
      });
    });

    return () => {
      // Cleanup when component unmounts or dependencies change
      advancedMarkerRefs.current.forEach(({ marker, listeners }) => {
        listeners.forEach(listener => listener.remove());
        marker.map = null;
      });
    };
  }, [map, locationData]);

  const handleDeleteLocation = async (locationId) => {
    if (window.confirm('Are you sure you want to delete this location? This will also delete all of its content.')) {
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
        await fetchLocations();
      } catch (error) {
        console.error('Error deleting location:', error);
        // Optionally show error to user
        alert(error.message || 'Failed to delete location');
      }
    }
  };

  const handleLoginSuccess = async (response) => {
    console.log('🚀 Login successful, setting initial data...'); // Debug log
    const { token, user } = response;
    
    localStorage.setItem('token', token);
    setUser(user);
    setIsUserComplete(false);
    
    await fetchLocations();
  };

  // Add this useEffect to monitor user state changes
  useEffect(() => {
    console.log('👤 Current user state:', user); // Debug log
  }, [user]);

  // User data completion effect
  useEffect(() => {
    let isMounted = true;

    const completeUserData = async () => {
      if (!user || user.isAdmin || isUserComplete) {
        return;
      }

      console.log('🔄 Completing user data...'); // Debug log
      setIsLoadingUser(true);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch complete user data');
        
        const fullUserData = await response.json();
        console.log('✅ Complete user data:', fullUserData); // Debug log
        
        if (isMounted) {
          setUser(fullUserData);
          localStorage.setItem('user', JSON.stringify(fullUserData));
          setIsUserComplete(true);
        }
      } catch (error) {
        console.error('❌ Error completing user data:', error);
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
        }
      }
    };

    completeUserData();

    return () => {
      isMounted = false;
    };
  }, [user, isUserComplete]);

  // Add this useEffect to check for Advanced Markers after map loads
  useEffect(() => {
    const checkAdvancedMarkers = () => {
      const hasAdvancedMarkers = window.google?.maps?.marker?.AdvancedMarkerElement;
      console.log('Advanced Markers Check:', {
        available: !!hasAdvancedMarkers,
        mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID,
        googleMaps: !!window.google?.maps,
        marker: !!window.google?.maps?.marker
      });
      setAdvancedMarkersAvailable(!!hasAdvancedMarkers);
    };

    if (map) {
      checkAdvancedMarkers();
    }
  }, [map]);

  const setupStatusBar = async () => {
    try {
      if (window.Capacitor?.getPlatform() !== 'web') {
        const { StatusBar } = await import('@capacitor/status-bar');
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      }
    } catch (error) {
      console.log('Status bar setup skipped in web mode');
    }
  };

  const checkLocationPermission = async () => {
    try {
      if (window.Capacitor?.getPlatform() !== 'web') {
        const { Geolocation } = await import('@capacitor/geolocation');
        const permissionStatus = await Geolocation.requestPermissions();
        return permissionStatus.location === 'granted';
      }
      return true; // Web browsers handle location permissions differently
    } catch (error) {
      console.log('Location permission check skipped in web mode');
      return true;
    }
  };

  const fetchLocations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🗺️ Fetching locations - Token exists:', !!token);
      console.log('🗺️ Fetching locations - User exists:', !!user);
      
      if (!token) {
        console.log('🗺️ No token available, skipping location fetch');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/locations?profile=false`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🗺️ Locations API response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      console.log('🗺️ Locations fetched successfully:', data.length, 'locations');
      setLocationData(data);
    } catch (err) {
      console.error('❌ Error fetching locations:', err);
      setLocationData([]);
    }
  }, [user]);

  // Memoize the router so it doesn't re-create on every render
  const router = useMemo(() => createBrowserRouter([
    {
      path: "/",
      element: (
        <div className="App">
          <nav className="main-nav">
            <Link to="/">Home</Link>
            {user && <Link to="/profile">Profile</Link>}
            {user?.isAdmin && <Link to="/admin">Admin</Link>}
            {user ? (
              <button onClick={handleLogout} className="logout-button">Logout</button>
            ) : (
              <Link to="/auth">Login</Link>
            )}
          </nav>
          <div className="map-container">
            <GoogleMap
              mapContainerStyle={mapStyles}
              center={center}
              zoom={13}
              onClick={handleMapClick}
              onLoad={handleMapLoad}
              onUnmount={handleMapUnmount}
              options={{
                mapId: MAPS_ID,
                disableDefaultUI: true,
                clickableIcons: false,
              }}
            >
              {locationData.map((location) => {
                const position = {
                  lat: Number(location.location?.coordinates?.[1]),
                  lng: Number(location.location?.coordinates?.[0]),
                };
                if (!position.lat || !position.lng) return null;

                // We will manage advanced markers inside useEffect
                return null;
              })}
              
              {selectedLocation && (
                <InfoWindow
                  position={selectedLocation}
                  onCloseClick={() => {
                    setSelectedLocation(null);
                  }}
                >
                  {/* Form for new location */}
                </InfoWindow>
              )}

              {selectedMarker && (
                <InfoWindow
                  position={{
                    lat: selectedMarker.location.coordinates[1],
                    lng: selectedMarker.location.coordinates[0],
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="marker-info-window">
                    <div className="marker-header">
                      <div className="poster-info">
                        <p className="poster-name">
                          {selectedMarker.content.isAnonymous
                            ? 'Posted anonymously'
                            : `Posted by: ${selectedMarker.creator?.profile?.name || 'Unknown User'}`}
                        </p>
                        <p className="post-date">
                          {new Date(selectedMarker.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="marker-stats">
                        {selectedMarker.credits > 0 && (
                          <div className="credits-badge">
                            💎 {selectedMarker.credits}
                          </div>
                        )}
                        <div className="points-badge">
                          {selectedMarker.upvotes - selectedMarker.downvotes} pts
                        </div>
                      </div>
                    </div>

                    <p>{selectedMarker.content.text}</p>
                    
                    <VoteButtons
                      location={selectedMarker}
                      onVoteUpdate={handleVoteUpdate}
                    />

                    {selectedMarker.content.mediaUrls && selectedMarker.content.mediaUrls.length > 0 && (
                      <div className="media-gallery">
                        {selectedMarker.content.mediaUrls.map((url, index) => {
                          const mediaType = selectedMarker.content.mediaTypes[index];
                          const fullUrl = `${API_URL}/${url.replace(/\\/g, '/')}`;
                          if (mediaType && mediaType.startsWith('video/')) {
                            return (
                              <video key={index} controls>
                                <source src={fullUrl} type={mediaType} />
                                Your browser does not support the video tag.
                              </video>
                            );
                          } else {
                            return (
                              <img key={index} src={fullUrl} alt="Location content" />
                            );
                          }
                        })}
                      </div>
                    )}
                    
                    {user && (user.isAdmin || user.id === selectedMarker.creatorId) && (
                      <button
                        onClick={() => handleDeleteLocation(selectedMarker.id)}
                        className="delete-button"
                      >
                        Delete Location
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>
        </div>
      ),
    },
    {
      path: "/auth",
      element: <AuthPage onLoginSuccess={handleLoginSuccess} />,
    },
    {
      path: "/profile",
      element: user ? <ProfilePage user={user} onLocationUpdate={fetchLocations} /> : <Navigate to="/auth" />,
    },
    {
      path: "/admin",
      element: user?.isAdmin ? <AdminDashboard /> : <Navigate to="/" />,
    },
  ]), [user, center, locationData, selectedLocation, selectedMarker]); // Add dependencies

  console.log("Render App:", { selectedMarker: selectedMarker, selectedLocation, routerPath});

  useEffect(() => {
    console.log('Advanced Marker Status:', {
      isAvailable: typeof AdvancedMarkerElement !== 'undefined',
      mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID,
    });
  }, []);

  useEffect(() => {
    if (user) {
      console.log('Fetching locations for user:', user);
      fetchLocations();
    }
  }, [user, fetchLocations]);

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

const getProfileImage = (location) => {
  if (location.content?.isAnonymous) {
    return '/images/anonymous-profile.jpg';
  }
  return location.creator?.profile?.pictureUrl 
    ? `${API_URL}/${location.creator.profile.pictureUrl}`
    : null;
};