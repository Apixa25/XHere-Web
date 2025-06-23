import React, { useState, useEffect, useCallback, useRef, createContext, useMemo } from 'react';
import { 
  GoogleMap, 
  LoadScript, 
  Marker,
  OverlayView,
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
import LOCATION_TYPES from './constants/locationTypes';
import LocationForm from './components/LocationForm';
import CommentSection from './components/CommentSection';
import { getEnvironmentConfig } from './config/environments';
import { testBackendConnectivity, testRegistration } from './utils/backendTest';

// Make test utilities available in browser console for debugging
if (typeof window !== 'undefined') {
  window.testBackendConnectivity = testBackendConnectivity;
  window.testRegistration = testRegistration;
  window.getEnvironmentConfig = getEnvironmentConfig;
}

const LIBRARIES = ['places', 'marker'];

// Create a context for Google Maps
const GoogleMapsContext = createContext(null);

// Get the current environment configuration
const config = getEnvironmentConfig();
const API_URL = config.API_URL;

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
  const timerIntervals = useRef({});
  const [selectedLocationType, setSelectedLocationType] = useState('all');
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const currentFetchController = useRef(null);
  const isUpdatingMarkers = useRef(false);
  const isUpdatingCenter = useRef(false);

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
          const response = await fetch(`${API_URL}/api/users/me`, {
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
    // Navigate to auth page after logout
    window.location.href = '/auth';
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
      data.append('creditAmount', formData.creditAmount || 0);
      data.append('locationType', formData.locationType || 'general');
      
      if (formData.media) {
        formData.media.forEach(file => {
          data.append('media', file);
        });
      }

      const response = await api.addLocation(data);
      console.log('Location created successfully:', response);
      
      setSelectedLocation(null);
      await fetchLocations();
      
    } catch (error) {
      console.error('Error submitting location data:', error);
      setError('Failed to submit location');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch locations with location type filtering
  const fetchLocations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🗺️ Fetching locations - Token exists:', !!token);
      console.log('🗺️ Fetching locations - User exists:', !!user);
      
      if (!token) {
        console.log('🗺️ No token available, skipping location fetch');
        return;
      }

      // Don't fetch if we're currently updating markers or center
      if (isUpdatingMarkers.current || isUpdatingCenter.current) {
        console.log('🔄 Skipping location fetch - markers or center update in progress');
        return;
      }
      
      // Cancel any existing request
      if (currentFetchController.current) {
        currentFetchController.current.abort();
      }
      
      // Create new abort controller for this request
      currentFetchController.current = new AbortController();
      
      setIsFetchingLocations(true);
      
      const url = new URL(`${API_URL}/api/locations`);
      url.searchParams.append('profile', 'false');
      if (selectedLocationType !== 'all') {
        url.searchParams.append('locationType', selectedLocationType);
      }
      
      // Add geographic filtering parameters for map view
      url.searchParams.append('lat', center.lat.toString());
      url.searchParams.append('lng', center.lng.toString());
      url.searchParams.append('radius', '5'); // 5 mile radius
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: currentFetchController.current.signal
      });
      
      console.log('🗺️ Locations API response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      console.log('🗺️ Locations fetched successfully:', data.length, 'locations');
      setLocationData(data);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('🗺️ Location fetch cancelled');
        return;
      }
      console.error('❌ Error fetching locations:', err);
      setLocationData([]);
    } finally {
      setIsFetchingLocations(false);
      currentFetchController.current = null;
    }
  }, [user, selectedLocationType, center]);

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
      
      // Add throttled bounds change listener to prevent runaway API calls
      let boundsChangeTimeout = null;
      const boundsChangeListener = mapInstance.addListener('bounds_changed', () => {
        // Don't trigger if we're currently updating the center programmatically
        if (isUpdatingCenter.current) {
          console.log('🔄 Skipping bounds change - center update in progress');
          return;
        }

        // Clear any existing timeout
        if (boundsChangeTimeout) {
          clearTimeout(boundsChangeTimeout);
        }
        
        // Throttle the center update to prevent excessive API calls
        boundsChangeTimeout = setTimeout(() => {
          const newCenter = mapInstance.getCenter();
          const newLat = newCenter.lat();
          const newLng = newCenter.lng();
          
          // Only refetch if center changed by more than 0.5 miles (roughly 0.007 degrees)
          const latDiff = Math.abs(newLat - center.lat);
          const lngDiff = Math.abs(newLng - center.lng);
          
          if (latDiff > 0.007 || lngDiff > 0.007) {
            console.log('🗺️ Map center changed significantly, updating location fetch');
            isUpdatingCenter.current = true;
            setCenter({ lat: newLat, lng: newLng });
            // Reset the flag after a short delay
            setTimeout(() => {
              isUpdatingCenter.current = false;
            }, 500);
          }
        }, 1000); // 1 second throttle
      });
      
      // Store the listener for cleanup
      mapRef.current.boundsChangeListener = boundsChangeListener;
      
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
    
    // Clean up bounds change listener
    if (mapRef.current?.boundsChangeListener) {
      mapRef.current.boundsChangeListener.remove();
      mapRef.current.boundsChangeListener = null;
    }
    
    setMap(null);
    Object.values(timerIntervals.current).forEach(clearInterval);
  }, []);

  useEffect(() => {
    if (!map || !locationData.length || !window.google?.maps?.marker?.AdvancedMarkerElement) {
      return;
    }

    // Prevent marker recreation during info window operations
    if (isUpdatingMarkers.current) {
      console.log('🔄 Skipping marker recreation - currently updating markers');
      return;
    }

    isUpdatingMarkers.current = true;

    // Clear previous markers
    advancedMarkerRefs.current.forEach(({ marker }) => {
      marker.map = null; // Remove marker from map
    });
    advancedMarkerRefs.current = [];
    Object.values(timerIntervals.current).forEach(clearInterval);
    timerIntervals.current = {};

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
          <div class="marker-type-icon">
            ${LOCATION_TYPES[location.locationType]?.icon || '📍'}
          </div>
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
            ${location.deleteAt ? `<span class="timer" id="timer-${location.id}"></span>` : ''}
          </div>
        </div>
      `;

      const advancedMarker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: markerElement,
        title: location.content?.text || 'Location'
      });

      if (location.deleteAt) {
        const timerElement = markerElement.querySelector(`#timer-${location.id}`);
        if (timerElement) {
          const intervalId = setInterval(() => {
            const deleteDate = new Date(location.deleteAt);
            const now = new Date();
            const timeLeft = Math.round((deleteDate.getTime() - now.getTime()) / 1000);

            if (timeLeft <= 0) {
              timerElement.innerText = 'Expired';
              clearInterval(intervalId);
            } else {
              const hours = Math.floor(timeLeft / 3600);
              const minutes = Math.floor((timeLeft % 3600) / 60);
              const seconds = timeLeft % 60;
              
              let timeString = '';
              if (hours > 0) {
                timeString += `${hours.toString().padStart(2, '0')}:`;
              }
              timeString += `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              timerElement.innerText = timeString;
            }
          }, 1000);
          timerIntervals.current[location.id] = intervalId;
        }
      }

      const listeners = [
        advancedMarker.addListener('click', () => {
          handleMarkerClick(location);
        }),
        advancedMarker.addListener('mouseover', () => {
          setHoveredMarker(location);
        }),
        advancedMarker.addListener('mouseout', () => {
          setHoveredMarker(null);
        })
      ];

      advancedMarkerRefs.current.push({ marker: advancedMarker, listeners });
    });

    // Reset the flag after a short delay to allow for any pending operations
    setTimeout(() => {
      isUpdatingMarkers.current = false;
    }, 100);
  }, [map, locationData.length]); // Only depend on map and locationData length, not the full array

  // Add missing functions
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

        setLocationData(prevLocations => 
          prevLocations.filter(loc => loc.id !== locationId)
        );
        setSelectedMarker(null);
        await fetchLocations();
      } catch (error) {
        console.error('Error deleting location:', error);
        alert(error.message || 'Failed to delete location');
      }
    }
  };

  const handleLoginSuccess = async (response) => {
    console.log('🚀 Login successful, setting initial data...');
    const { token, user } = response;
    
    localStorage.setItem('token', token);
    setUser(user);
    setIsUserComplete(false);
    
    await fetchLocations();
    
    // Navigate to home page after successful login
    window.location.href = '/';
  };

  // Monitor user state changes
  useEffect(() => {
    console.log('👤 Current user state:', user);
  }, [user]);

  // Complete user data
  useEffect(() => {
    let isMounted = true;

    const completeUserData = async () => {
      if (!user || user.isAdmin || isUserComplete) {
        return;
      }

      console.log('🔄 Completing user data...');
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
        console.log('✅ Complete user data:', fullUserData);
        
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

  // Check for Advanced Markers
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

  // Fetch locations when user is set
  useEffect(() => {
    if (user) {
      console.log('Fetching locations for user:', user);
      fetchLocations();
    }
  }, [user, fetchLocations]);

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
          
          {/* Location Type Filter */}
          {user && (
            <div className="location-filter">
              <div className="filter-buttons">
                <button 
                  className={`filter-button ${selectedLocationType === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedLocationType('all')}
                >
                  🌍 All
                </button>
                {Object.entries(LOCATION_TYPES).map(([key, type]) => (
                  <button 
                    key={key}
                    className={`filter-button ${selectedLocationType === key ? 'active' : ''}`}
                    onClick={() => setSelectedLocationType(key)}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
              <div className="location-count-display">
                <span className="count-text">
                  📍 {locationData.length}/25 locations
                  {isFetchingLocations && <span style={{color: '#FFA726'}}> 🔄</span>}
                </span>
              </div>
            </div>
          )}
          
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
                gestureHandling: 'greedy',
              }}
            >
              {selectedLocation && (
                <OverlayView
                  position={selectedLocation}
                  mapPaneName={OverlayView.FLOAT_PANE}
                >
                  <div
                    className="custom-info-window"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <LocationForm
                      position={selectedLocation}
                      onSubmit={handleLocationSubmit}
                      submitting={submitting}
                      onClose={() => setSelectedLocation(null)}
                      user={user}
                    />
                  </div>
                </OverlayView>
              )}

              {selectedMarker && (
                <OverlayView
                  position={{
                    lat: selectedMarker.location.coordinates[1],
                    lng: selectedMarker.location.coordinates[0],
                  }}
                  mapPaneName={OverlayView.FLOAT_PANE}
                >
                  <div
                    className="custom-info-window location-details-content"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMarker(null);
                      }}
                      className="close-button"
                    >&times;</button>
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
                        {/* This will be empty, badges are moved below */}
                      </div>
                    </div>

                    <div className="location-badges-container">
                      <div className="location-type-badge">
                        {LOCATION_TYPES[selectedMarker.locationType]?.icon || '📍'} {LOCATION_TYPES[selectedMarker.locationType]?.label || 'General'}
                      </div>
                      <div className="marker-stats-right">
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
                              <video key={index} controls className="location-video">
                                <source src={fullUrl} type={mediaType} />
                                Your browser does not support the video tag.
                              </video>
                            );
                          } else {
                            return (
                              <img key={index} src={fullUrl} alt="Location content" className="location-image" />
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

                    {/* Comment Section */}
                    <CommentSection
                      locationId={selectedMarker.id}
                      user={user}
                      onNewBadges={(newBadges) => {
                        // Handle new badges from comments
                        if (newBadges && newBadges.length > 0) {
                          // You can add badge notification logic here
                          console.log('New badges from comments:', newBadges);
                        }
                      }}
                    />
                  </div>
                </OverlayView>
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
  ]), [user, center, locationData, selectedLocation, selectedMarker, selectedLocationType, handleLogout, handleMapClick, handleLocationSubmit, submitting, handleVoteUpdate, handleDeleteLocation, handleLoginSuccess, fetchLocations]);

  console.log("Render App:", { selectedMarker: selectedMarker, selectedLocation, routerPath});

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