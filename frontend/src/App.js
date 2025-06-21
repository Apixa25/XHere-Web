import React, { useState, useEffect, useCallback, useRef, createContext } from 'react';
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
  setSelectedMarker,
  handleVoteUpdate,
  submitting
}) {
  const [assignCredits, setAssignCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);

  console.log('LocationInfoWindow user prop:', user);
  console.log('LocationInfoWindow user credits:', user?.profile?.credits, user?.credits);
  console.log('LocationInfoWindow user profile:', user?.profile);

  const getStatusBadge = () => {
    switch(selectedMarker.verificationStatus) {
      case 'verified':
        return (
          <div style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'inline-block',
            marginLeft: '8px'
          }}>
            ✓ Verified
          </div>
        );
      case 'pending':
        return (
          <div style={{
            backgroundColor: '#FFA726',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'inline-block',
            marginLeft: '8px'
          }}>
            ⏳ Pending Verification
          </div>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      text: contentForm.text,
      media: contentForm.media,
      isAnonymous: contentForm.isAnonymous,
      autoDelete: contentForm.autoDelete,
      deleteTime: contentForm.deleteTime,
      deleteUnit: contentForm.deleteUnit,
      creditAmount: assignCredits ? creditAmount : 0
    };

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting location:', error);
    }
  };

  if (selectedLocation) {
    return (
      <InfoWindow
        position={selectedLocation}
        onCloseClick={() => onClose('location')}
      >
        <form onSubmit={handleSubmit}>
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
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '10px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
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
            
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                id="autoDelete"
                checked={contentForm.autoDelete}
                onChange={e => setContentForm({ 
                  ...contentForm, 
                  autoDelete: e.target.checked 
                })}
                style={{ marginRight: '8px' }}
              />
              <label htmlFor="autoDelete" style={{ fontSize: '14px', color: '#666' }}>
                Auto-delete after
              </label>
              {contentForm.autoDelete && (
                <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
                  <input
                    type="number"
                    min="1"
                    value={contentForm.deleteTime}
                    onChange={e => setContentForm({
                      ...contentForm,
                      deleteTime: parseInt(e.target.value) || 0
                    })}
                    style={{ 
                      width: '60px',
                      marginRight: '8px',
                      padding: '4px'
                    }}
                  />
                  <select
                    value={contentForm.deleteUnit}
                    onChange={e => setContentForm({
                      ...contentForm,
                      deleteUnit: e.target.value
                    })}
                    style={{ padding: '4px' }}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="form-section credits-section">
            <div className="credits-toggle">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={assignCredits}
                  onChange={(e) => {
                    setAssignCredits(e.target.checked);
                    if (!e.target.checked) setCreditAmount(0);
                  }}
                />
                Assign XHere credits to this location
              </label>
            </div>

            {assignCredits && (
              <div className="credits-input-container">
                <div className="credits-balance">
                  Available: {user?.credits ?? 0} credits
                </div>
                <div className="credits-input-group">
                  <label htmlFor="creditAmount">Amount to assign:</label>
                  <input
                    id="creditAmount"
                    type="number"
                    min="1"
                    max={user?.credits ?? 0}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(Math.min(
                      parseInt(e.target.value) || 0,
                      user?.credits ?? 0
                    ))}
                    className="credits-input"
                  />
                </div>
                <div className="credits-info">
                  <small>
                    These credits will be available for other users to collect 
                    when they visit this location.
                  </small>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={submitting || (assignCredits && creditAmount > (user?.credits ?? 0))}
            style={{
              opacity: (submitting || (assignCredits && creditAmount > (user?.credits ?? 0))) ? 0.7 : 1,
              cursor: (submitting || (assignCredits && creditAmount > (user?.credits ?? 0))) ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Submitting...' : 'Submit'}
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
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div>
              <p style={{ 
                fontSize: '14px', 
                color: '#666',
                fontStyle: 'italic',
                margin: 0
              }}>
                {selectedMarker.content.isAnonymous === true ? 
                  'Posted anonymously' : 
                  `Posted by: ${selectedMarker.creator?.profile?.name || 'Unknown User'}`
                }
              </p>
              <p style={{ 
                fontSize: '12px', 
                color: '#666',
                margin: '0',
                marginTop: '2px'
              }}>
                {new Date(selectedMarker.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {selectedMarker.credits > 0 && (
                <div style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  💎 {selectedMarker.credits} Credits
                </div>
              )}
              <div style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {selectedMarker.upvotes - selectedMarker.downvotes} pts
              </div>
              {getStatusBadge()}
            </div>
          </div>

          <p style={{ 
            fontSize: '14px',
            marginBottom: '10px' 
          }}>{selectedMarker.content.text}</p>
          
          <VoteButtons 
            location={selectedMarker}
            onVoteUpdate={handleVoteUpdate}
          />
          
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

// Add this helper function at the top of your component
const isAdvancedMarkerAvailable = () => {
  return window.google?.maps?.marker?.AdvancedMarkerElement !== undefined;
};

function App() {
  // 1. States first
  const [user, setUser] = useState(null);
  const [isUserComplete, setIsUserComplete] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [locationData, setLocationData] = useState([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  // 2. Define fetchLocations using useCallback
  const fetchLocations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/locations?profile=false`, {
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
      setLocationData([]);
    }
  }, []); // Empty deps array if no dependencies needed

  // 3. Now we can use fetchLocations in our effects
  useEffect(() => {
    if (user) {
      console.log('Fetching locations for user:', user);
      fetchLocations();
    }
  }, [user, fetchLocations]);

  // 2. All useEffect hooks together
  useEffect(() => {
    if (!user) {
      // Set background image for login page
      document.documentElement.style.setProperty(
        '--bg-image',
        `url(${backgroundImage})`
      );
      document.body.classList.add('auth-page');
    } else {
      // Remove background image for other pages
      document.documentElement.style.removeProperty('--bg-image');
      document.body.classList.remove('auth-page');
    }
  }, [user]);

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

  const mapStyles = {
    height: "100vh",
    width: "100%"
  };

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('http://localhost:3000/api/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Token verification failed');
          }
          
          const userData = await response.json();
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
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
    if (markersRef.current) {
      markersRef.current.forEach(({ marker, listeners }) => {
        try {
          // Remove all event listeners
          listeners.forEach(cleanup => {
            try {
              cleanup();
            } catch (e) {
              console.warn('Error cleaning up listener:', e);
            }
          });

          // Remove marker from map
          if (marker && marker.map) {
            marker.map = null;
          }
        } catch (error) {
          console.warn('Error during marker cleanup:', error);
        }
      });
      markersRef.current = [];
    }
  }, []);

  const renderContent = useCallback(() => {
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) {
      console.log('Map or AdvancedMarkerElement not ready');
      return null;
    }

    // Clear existing markers before creating new ones
    handleMapUnmount();

    return locationData.map((location) => {
      try {
        const position = {
          lat: Number(location.location?.coordinates?.[1]),
          lng: Number(location.location?.coordinates?.[0])
        };

        if (!position.lat || !position.lng) {
          console.warn('Invalid position for location:', location.id);
          return null;
        }

        console.log('Creating advanced marker for location:', location.id);
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

        // Store listeners in an array for cleanup
        const listeners = [];

        // Add hover animation
        const mouseEnterListener = () => {
          markerElement.classList.add('pulse');
        };
        const mouseLeaveListener = () => {
          markerElement.classList.remove('pulse');
          void markerElement.offsetWidth; // Reset animation
        };
        const clickListener = () => {
          markerElement.classList.add('bounce');
          setTimeout(() => {
            markerElement.classList.remove('bounce');
          }, 1000);
        };

        markerElement.addEventListener('mouseenter', mouseEnterListener);
        markerElement.addEventListener('mouseleave', mouseLeaveListener);
        markerElement.addEventListener('gmp-click', clickListener);

        listeners.push(
          () => markerElement.removeEventListener('mouseenter', mouseEnterListener),
          () => markerElement.removeEventListener('mouseleave', mouseLeaveListener),
          () => markerElement.removeEventListener('gmp-click', clickListener)
        );

        const clickHandler = () => handleMarkerClick(location);
        const mouseOverHandler = () => setHoveredMarker(location);
        const mouseOutHandler = () => setHoveredMarker(null);

        advancedMarker.addListener('gmp-click', clickHandler);
        advancedMarker.addListener('mouseover', mouseOverHandler);
        advancedMarker.addListener('mouseout', mouseOutHandler);

        listeners.push(
          () => window.google.maps.event.clearInstanceListeners(advancedMarker, 'gmp-click'),
          () => window.google.maps.event.clearInstanceListeners(advancedMarker, 'mouseover'),
          () => window.google.maps.event.clearInstanceListeners(advancedMarker, 'mouseout')
        );

        // Store marker and listeners for cleanup
        markersRef.current.push({ marker: advancedMarker, listeners });

        return null; // We're handling the marker directly, no need to return anything
      } catch (error) {
        console.error('Error creating marker:', error);
        return null;
      }
    });
  }, [map, locationData, handleMarkerClick, setHoveredMarker, handleMapUnmount]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      handleMapUnmount();
    };
  }, [handleMapUnmount]);

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
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      // Optionally show error to user
      alert(error.message || 'Failed to delete location');
    }
  };

  const renderAuthForm = () => (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isRegistering ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleAuth}>
          <input
            type="email"
            required
            placeholder="Enter your email"
            className="mobile-input"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            autoComplete="email"
          />
          <input
            type="password"
            required
            placeholder="Enter your password"
            className="mobile-input"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            autoComplete={isRegistering ? "current-password" : "new-password"}
          />
          {isRegistering && (
            <input
              type="text"
              required
              placeholder="Enter your name"
              className="mobile-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              autoComplete="name"
            />
          )}
          <button type="submit" className="mobile-button">
            {isRegistering ? 'Register' : 'Login'}
          </button>
        </form>
        <button 
          onClick={() => {
            setIsRegistering(!isRegistering);
            setFormData({ email: '', password: '', name: '' });
          }}
          className="mobile-button secondary"
        >
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </button>
      </div>
    </div>
  );

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      
      const response = await fetch(`${API_URL}/api/users/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: credentialResponse.credential,
          email: decoded.email,
          name: decoded.name
        })
      });

      if (!response.ok) {
        throw new Error('Google authentication failed');
      }

      const data = await response.json();
      console.log('Google login response:', data); // Debug log

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to login with Google');
    }
  };

  // 3. Login success handler
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
            {user?.isAdmin && (
              <Link to="/admin">
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>Admin</button>
              </Link>
            )}
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
              center={center}
              onClick={handleMapClick}
              onLoad={handleMapLoad}
              onUnmount={handleMapUnmount}
              options={{
                disableDefaultUI: true,
                clickableIcons: false,
                mapTypeControl: false,
                fullscreenControl: false,
                streetViewControl: false,
                mapId: 'd90da36315b1554f',
                useAdvancedMarkers: true,
                useStaticMap: false
              }}
            >
              {renderContent()}

              {/* Single InfoWindow component */}
              {(selectedLocation || selectedMarker) && (
                <LocationInfoWindow
                  selectedLocation={selectedLocation}
                  selectedMarker={selectedMarker}
                  onClose={() => {
                    setSelectedLocation(null);
                    setSelectedMarker(null);
                  }}
                  onSubmit={handleLocationSubmit}
                  contentForm={contentForm}
                  setContentForm={setContentForm}
                  user={user}
                  handleDeleteLocation={handleDeleteLocation}
                  setSelectedMarker={setSelectedMarker}
                  handleVoteUpdate={handleVoteUpdate}
                  submitting={submitting}
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
    },
    {
      path: "/admin",
      element: user?.isAdmin ? (
        <AdminDashboard />
      ) : (
        <Navigate to="/" replace />
      )
    }
  ]);

  console.log('States:', { selectedMarker, selectedLocation });

  console.log('Render App:', { 
    selectedMarker: selectedMarker ? selectedMarker._id : null,
    selectedLocation: selectedLocation,
    routerPath: window.location.pathname 
  });

  console.log('Detailed location data:', locationData.map(loc => ({
    id: loc.id,
    lat: loc?.location?.coordinates?.[1],
    lng: loc?.location?.coordinates?.[0],
    text: loc?.content?.text,
    creator: loc?.creator?.email
  })));

  console.log('Rendering markers for locations:', locationData.map(inspectLocation));

  console.log('Advanced Marker Status:', {
    isAvailable: isAdvancedMarkerAvailable(),
    mapId: process.env.REACT_APP_GOOGLE_MAPS_MAP_ID
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

const getProfileImage = (location) => {
  if (location.content?.isAnonymous) {
    return '/images/anonymous-profile.jpg';
  }
  return location.creator?.profile?.pictureUrl 
    ? `${API_URL}/${location.creator.profile.pictureUrl}`
    : null;
};