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
import './styles/AppMobile.css'; // New mobile-specific styles
import BadgeNotification from './components/BadgeNotification';
import VoteButtons from './components/VoteButtons';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { createBrowserRouter, RouterProvider, Link, Navigate, MemoryRouter } from 'react-router-dom';
import ProfilePage from './components/ProfilePage';
import backgroundImage from './images/background.jpg';
import './styles/LocationForm.css';
import AdminDashboard from './components/admin/AdminDashboard';
import './styles/markers.css';
import PROFILE_TYPES from './constants/profileTypes';
import LOCATION_TYPES from './constants/locationTypes';

// Import Capacitor plugins
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Device } from '@capacitor/device';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { App as CapApp } from '@capacitor/app';

const LIBRARIES = ['places', 'marker'];

// Create a context for Google Maps
const GoogleMapsContext = createContext(null);

// Use environment variables with fallbacks for mobile
const API_URL = process.env.REACT_APP_API_URL || 'http://10.0.2.2:3000';

const defaultCenter = {
  lat: 41.7555,
  lng: -124.2025
};

const FORCE_ADVANCED_MARKER = true; // Temporary override for testing

const USE_ADVANCED_MARKER = String(process.env.REACT_APP_USE_ADVANCED_MARKER).toLowerCase() === 'true';

const MAPS_ID = process.env.REACT_APP_GOOGLE_MAPS_MAP_ID;

function GoogleMapsProvider({ children }) {
  const [timeoutReached, setTimeoutReached] = useState(false);
  const [bypassMaps, setBypassMaps] = useState(false);
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
    mapIds: ['51948ac5ec373e9c']
  });

  // Add timeout mechanism
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isLoaded && !loadError) {
        console.warn('⚠️ Google Maps loading timeout reached');
        setTimeoutReached(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isLoaded, loadError]);

  // Add debugging
  console.log('🗺️ GoogleMapsProvider Status:', {
    isLoaded,
    loadError: loadError?.message,
    timeoutReached,
    bypassMaps,
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing',
    apiKeyLength: process.env.REACT_APP_GOOGLE_MAPS_API_KEY?.length || 0,
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID ? 'Present' : 'Missing',
    libraries: LIBRARIES,
    nodeEnv: process.env.NODE_ENV
  });

  // Temporary bypass for debugging
  if (bypassMaps) {
    console.log('🔄 Bypassing Google Maps for debugging');
    return children;
  }

  if (loadError) {
    console.error('❌ Error loading maps:', loadError);
    // Instead of blocking the entire app, let's show a fallback
    return (
      <div className="error-container">
        <h3>⚠️ Maps Loading Error</h3>
        <p>Error: {loadError.message}</p>
        <p>Please check your internet connection and try again.</p>
        <button onClick={() => window.location.reload()}>🔄 Reload App</button>
        <button onClick={() => setBypassMaps(true)} style={{marginLeft: '10px'}}>🚀 Continue Without Maps</button>
        {/* Still render children so the app can function without maps */}
        {children}
      </div>
    );
  }

  if (!isLoaded && !timeoutReached) {
    console.log('⏳ Google Maps still loading...');
    return (
      <div className="loading-container">
        <div className="loading-spinner">🗺️</div>
        <p>Loading maps...</p>
        {/* Add a timeout fallback */}
        <div style={{marginTop: '10px'}}>
          <button onClick={() => window.location.reload()}>🔄 Reload</button>
          <button onClick={() => setBypassMaps(true)} style={{marginLeft: '10px'}}>🚀 Continue Without Maps</button>
        </div>
      </div>
    );
  }

  // If timeout reached, show a warning but continue
  if (timeoutReached && !isLoaded) {
    console.warn('⚠️ Proceeding without Google Maps due to timeout');
    return (
      <div style={{padding: '10px', background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '5px', margin: '10px'}}>
        <h4>⚠️ Maps Loading Slow</h4>
        <p>Google Maps is taking longer than expected to load. The app will continue to function.</p>
        <button onClick={() => setBypassMaps(true)}>🚀 Continue Without Maps</button>
        {children}
      </div>
    );
  }

  console.log('✅ Google Maps loaded successfully!');
  return children;
}

// Mobile-optimized location info window
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
  const [photoTaken, setPhotoTaken] = useState(null);
  const [videoRecorded, setVideoRecorded] = useState(null);

  const getStatusBadge = () => {
    switch(selectedMarker?.verificationStatus) {
      case 'verified':
        return (
          <div className="status-badge verified">
            ✓ Verified
          </div>
        );
      case 'pending':
        return (
          <div className="status-badge pending">
            ⏳ Pending
          </div>
        );
      default:
        return null;
    }
  };

  // Use Capacitor Camera API for taking photos
  const takePicture = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      
      // Convert the URI to a file
      const response = await fetch(image.webPath);
      const blob = await response.blob();
      const fileName = `photo_${new Date().getTime()}.${image.format}`;
      const file = new File([blob], fileName, { type: `image/${image.format}` });
      
      setPhotoTaken(file);
      
      // Add to form media
      const updatedMedia = [...contentForm.media, file];
      setContentForm({ ...contentForm, media: updatedMedia });
      
    } catch (error) {
      console.error('Error taking picture:', error);
      // Show user-friendly error
      alert('Could not access camera. Please check your permissions.');
    }
  };

  // Record video using Capacitor Camera API
  const recordVideo = async () => {
    try {
      const video = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: false,
        width: 1280,
        height: 720,
        correctOrientation: true
      });
      
      // Convert the URI to a file
      const response = await fetch(video.webPath);
      const blob = await response.blob();
      const fileName = `video_${new Date().getTime()}.mp4`;
      const file = new File([blob], fileName, { type: 'video/mp4' });
      
      setVideoRecorded(file);
      
      // Add to form media
      const updatedMedia = [...contentForm.media, file];
      setContentForm({ ...contentForm, media: updatedMedia });
      
    } catch (error) {
      console.error('Error recording video:', error);
      alert('Could not record video. Please check your permissions.');
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
        <form onSubmit={handleSubmit} className="mobile-form">
          <textarea
            value={contentForm.text}
            onChange={e => setContentForm({ ...contentForm, text: e.target.value })}
            placeholder="Enter location description"
            className="mobile-textarea"
          />
          
          <div className="mobile-location-type-selector">
            <label htmlFor="locationType">Location Type:</label>
            <select
              id="locationType"
              value={contentForm.locationType}
              onChange={e => setContentForm({ ...contentForm, locationType: e.target.value })}
              className="mobile-select"
            >
              {Object.entries(LOCATION_TYPES).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mobile-media-buttons">
            <button 
              type="button" 
              onClick={takePicture}
              className="mobile-button camera-button"
            >
              📷 Take Photo
            </button>
            <button 
              type="button" 
              onClick={recordVideo}
              className="mobile-button video-button"
            >
              🎥 Record Video
            </button>
          </div>
          
          {/* Show thumbnails of captured media */}
          <div className="media-preview">
            {contentForm.media.map((file, index) => (
              <div key={index} className="media-thumbnail">
                {file.type.startsWith('image/') ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Media ${index}`} 
                    className="thumbnail"
                  />
                ) : (
                  <div className="video-thumbnail">🎬</div>
                )}
                <button 
                  type="button" 
                  className="remove-media"
                  onClick={() => {
                    const updatedMedia = [...contentForm.media];
                    updatedMedia.splice(index, 1);
                    setContentForm({ ...contentForm, media: updatedMedia });
                  }}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
          
          <div className="mobile-options">
            <div className="mobile-option">
              <input
                type="checkbox"
                id="anonymous"
                checked={contentForm.isAnonymous}
                onChange={e => setContentForm({ 
                  ...contentForm, 
                  isAnonymous: e.target.checked 
                })}
              />
              <label htmlFor="anonymous">
                Post anonymously
              </label>
            </div>
            
            <div className="mobile-option">
              <input
                type="checkbox"
                id="autoDelete"
                checked={contentForm.autoDelete}
                onChange={e => setContentForm({ 
                  ...contentForm, 
                  autoDelete: e.target.checked 
                })}
              />
              <label htmlFor="autoDelete">
                Auto-delete after
              </label>
            </div>
          </div>
          {contentForm.autoDelete && (
            <div className="delete-options">
              <input
                type="number"
                min="1"
                value={contentForm.deleteTime}
                onChange={e => setContentForm({
                  ...contentForm,
                  deleteTime: parseInt(e.target.value) || 0
                })}
                className="time-input"
              />
              <select
                value={contentForm.deleteUnit}
                onChange={e => setContentForm({
                  ...contentForm,
                  deleteUnit: e.target.value
                })}
                className="unit-select"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          )}
          
          <div className="mobile-credits-section">
            <div className="credits-toggle">
              <input
                type="checkbox"
                id="assignCredits"
                checked={assignCredits}
                onChange={(e) => {
                  setAssignCredits(e.target.checked);
                  if (!e.target.checked) setCreditAmount(0);
                }}
              />
              <label htmlFor="assignCredits">
                Place Crypto (Avail: {user?.credits ?? 0})
              </label>
            </div>

            {assignCredits && (
              <div className="credits-input-container">
                <div className="credits-balance">
                  Available: {user?.credits ?? 0} credits
                </div>
                <div className="credits-input-group">
                  <label htmlFor="creditAmount">Amount:</label>
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
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={submitting || (assignCredits && creditAmount > (user?.credits ?? 0))}
            className={`mobile-submit-button ${
              submitting || (assignCredits && creditAmount > (user?.credits ?? 0)) 
                ? 'disabled' : ''
            }`}
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
        <div className="mobile-marker-info">
          <div className="mobile-marker-header">
            <div className="poster-info">
              <p className="poster-name">
                {selectedMarker.content.isAnonymous === true ? 
                  'Posted anonymously' : 
                  `Posted by: ${selectedMarker.creator?.profile?.name || 'Unknown User'}`
                }
              </p>
              <p className="post-date">
                {new Date(selectedMarker.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="marker-stats">
              <div className="location-type-badge">
                {LOCATION_TYPES[selectedMarker.locationType]?.icon || '📍'} {LOCATION_TYPES[selectedMarker.locationType]?.label || 'General'}
              </div>
              {selectedMarker.credits > 0 && (
                <div className="credits-badge">
                  💎 {selectedMarker.credits}
                </div>
              )}
              <div className="points-badge">
                {selectedMarker.upvotes - selectedMarker.downvotes} pts
              </div>
              {getStatusBadge()}
            </div>
          </div>

          <p className="marker-text">{selectedMarker.content.text}</p>
          
          <VoteButtons 
            location={selectedMarker}
            onVoteUpdate={handleVoteUpdate}
          />
          
          {selectedMarker.content.mediaUrls && selectedMarker.content.mediaUrls.length > 0 && (
            <div className="mobile-media-gallery">
              {selectedMarker.content.mediaUrls.map((url, index) => {
                const mediaType = selectedMarker.content.mediaTypes[index];
                if (mediaType.startsWith('video/')) {
                  return (
                    <video
                      key={index}
                      controls
                      className="mobile-video"
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
                      className="mobile-image"
                    />
                  );
                }
              })}
            </div>
          )}
          {user && (user.isAdmin || (selectedMarker.creator && user.userId === selectedMarker.creator._id)) && (
            <button
              onClick={() => handleDeleteLocation(selectedMarker.id)}
              className="mobile-delete-button"
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

// Helper function to get user from storage
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

// Helper function to check if advanced marker is available
const isAdvancedMarkerAvailable = () => {
  return window.google?.maps?.marker?.AdvancedMarkerElement !== undefined;
};

function AppMobile() {
  // Initialize status bar for mobile
  useEffect(() => {
    const setupStatusBar = async () => {
      try {
        if (window.Capacitor?.getPlatform() !== 'web') {
          await StatusBar.setStyle({ style: Style.Dark });
          await SplashScreen.hide();
        }
      } catch (error) {
        console.log('Status bar setup skipped in web mode');
      }
    };
    
    setupStatusBar();
    
    // Handle back button
    const backButtonHandler = CapApp.addListener('backButton', () => {
      // Handle back button press
      if (selectedMarker || selectedLocation) {
        setSelectedMarker(null);
        setSelectedLocation(null);
        return;
      }
      
      // Otherwise let the system handle it
      CapApp.exitApp();
    });
    
    return () => {
      backButtonHandler.remove();
      // Cleanup timers on component unmount
      Object.values(timerIntervals.current).forEach(clearInterval);
    };
  }, []);

  // States
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
    deleteUnit: 'minutes',
    locationType: 'general'
  });
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(null);
  const [hoveredMarker, setHoveredMarker] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [advancedMarkersAvailable, setAdvancedMarkersAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState('map');
  const [locationPermission, setLocationPermission] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [selectedLocationType, setSelectedLocationType] = useState('all');
  const timerIntervals = useRef({});
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  // Get device info
  useEffect(() => {
    const getDeviceInfo = async () => {
      try {
        const info = await Device.getInfo();
        setDeviceInfo(info);
      } catch (error) {
        console.error('Error getting device info:', error);
      }
    };
    
    getDeviceInfo();
  }, []);

  // Check and request location permission
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        const status = await Geolocation.checkPermissions();
        
        if (status.location === 'granted') {
          setLocationPermission(true);
        } else {
          const requestStatus = await Geolocation.requestPermissions();
          setLocationPermission(requestStatus.location === 'granted');
        }
        
        // If permission granted, get current position
        if (status.location === 'granted' || status.location === 'prompt') {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000
          });
          
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        }
      } catch (error) {
        console.error('Error checking location permission:', error);
        setLocationPermission(false);
      }
    };
    
    checkLocationPermission();
  }, []);

  const mapStyles = {
    height: "100%",
    width: "100%"
  };

  // Fetch locations using Capacitor
  const fetchLocations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const url = new URL(`${API_URL}/api/locations`);
      url.searchParams.append('profile', 'false');
      if (selectedLocationType !== 'all') {
        url.searchParams.append('locationType', selectedLocationType);
      }
      
      // Add geographic filtering parameters for map view
      url.searchParams.append('lat', center.lat.toString());
      url.searchParams.append('lng', center.lng.toString());
      url.searchParams.append('radius', '5'); // 5 mile radius
      
      setIsFetchingLocations(true);
      
      const response = await fetch(url.toString(), {
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
    } finally {
      setIsFetchingLocations(false);
    }
  }, [selectedLocationType, center]);

  // Fetch locations when user is set
  useEffect(() => {
    if (user) {
      console.log('Fetching locations for user:', user);
      fetchLocations();
    }
  }, [user, fetchLocations]);

  // Set background for auth page
  useEffect(() => {
    if (!user) {
      document.documentElement.style.setProperty(
        '--bg-image',
        `url(${backgroundImage})`
      );
      document.body.classList.add('auth-page', 'mobile-auth-page');
    } else {
      document.documentElement.style.removeProperty('--bg-image');
      document.body.classList.remove('auth-page', 'mobile-auth-page');
    }
  }, [user]);

  // Verify token on app start
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/users/me`, {
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

  // Handle authentication
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

      const response = await fetch(`${API_URL}/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

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
      alert(error.message || 'Authentication failed');
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Handle vote updates
  const handleVoteUpdate = async (updatedLocation) => {
    setLocationData(prevLocations => prevLocations.map(loc => 
      loc.id === updatedLocation.id ? { ...loc, ...updatedLocation } : loc
    ));

    setSelectedMarker(prevMarker => 
      prevMarker?.id === updatedLocation.id 
        ? { ...prevMarker, ...updatedLocation }
        : prevMarker
    );

    try {
      const { newBadges } = await api.checkBadges();
      if (newBadges && newBadges.length > 0) {
        setNewBadges(newBadges);
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  // Handle map click using Capacitor Geolocation
  const handleMapClick = async (e) => {
    if (!user) return;
    
    if (!e.placeId) {
      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();
      
      setSelectedLocation({
        lat: clickedLat,
        lng: clickedLng
      });
      setSelectedMarker(null);
    }
  };

  // Handle marker click
  const handleMarkerClick = (location) => {
    console.log("Marker clicked:", location);
    setSelectedMarker(location);
    setSelectedLocation(null);
  };

  // Handle location submission with Capacitor
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
      
      setContentForm({
        text: '',
        media: [],
        isAnonymous: false,
        autoDelete: false,
        deleteTime: 0,
        deleteUnit: 'minutes',
        locationType: 'general'
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

  // Helper function to inspect location data
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

  // Handle map load
  const handleMapLoad = (mapInstance) => {
    console.log('Map loaded, checking advanced markers');
    setMap(mapInstance);
    
    // Add throttled bounds change listener to prevent runaway API calls
    let boundsChangeTimeout = null;
    const boundsChangeListener = mapInstance.addListener('bounds_changed', () => {
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
          setCenter({ lat: newLat, lng: newLng });
        }
      }, 1000); // 1 second throttle
    });
    
    setTimeout(() => {
      if (window.google?.maps?.marker?.AdvancedMarkerElement) {
        setAdvancedMarkersAvailable(true);
        console.log('Advanced markers enabled');
      } else {
        console.warn('Advanced markers not available');
      }
    }, 1000);
  };

  // Handle map unmount
  const handleMapUnmount = () => {
    try {
      console.log('Map unmounting');
      setMap(null);
    } catch (error) {
      console.error('Error unmounting map:', error);
    }
  };

  // Handle location deletion
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

      setLocationData(prevLocations => 
        prevLocations.filter(loc => loc.id !== locationId)
      );
      setSelectedMarker(null);
      await fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert(error.message || 'Failed to delete location');
    }
  };

  // Mobile-optimized authentication form
  const renderAuthForm = () => (
    <div className="mobile-auth-container">
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleAuth} className="mobile-auth-form">
        {isRegistering && (
          <div className="mobile-form-group">
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required={isRegistering}
              placeholder="Enter your name"
              className="mobile-input"
            />
          </div>
        )}
        <div className="mobile-form-group">
          <label>Email:</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            placeholder="Enter your email"
            className="mobile-input"
          />
        </div>
        <div className="mobile-form-group">
          <label>Password:</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
            className="mobile-input"
          />
        </div>
        <button type="submit" className="mobile-auth-button">
          {isRegistering ? 'Register' : 'Login'}
        </button>
        <button 
          type="button" 
          onClick={() => {
            setIsRegistering(!isRegistering);
            setFormData({ email: '', password: '', name: '' });
          }}
          className="mobile-switch-button"
        >
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </button>
      </form>
    </div>
  );

  // Handle Google login
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
      console.log('Google login response:', data);

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to login with Google');
    }
  };

  // Handle login success
  const handleLoginSuccess = async (response) => {
    console.log('🚀 Login successful, setting initial data...');
    const { token, user } = response;
    
    localStorage.setItem('token', token);
    setUser(user);
    setIsUserComplete(false);
    
    await fetchLocations();
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

  // Function to get current location
  const getCurrentLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      const newCenter = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      
      setCenter(newCenter);
      
      if (map) {
        map.panTo(newCenter);
        map.setZoom(15);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Could not get your current location. Please check your permissions.');
    }
  };

  // Only render the map when user is logged in
  if (!user) {
    console.log('🔐 No user found, showing auth form');
    return renderAuthForm();
  }

  console.log('🎯 User authenticated, rendering main app. Active tab:', activeTab);

  // Mobile-optimized UI based on active tab
  const renderContent = () => {
    console.log('🎨 Rendering content for tab:', activeTab);
    
    switch (activeTab) {
      case 'map':
        console.log('🗺️ Rendering map tab');
        // Clear all existing timers before re-rendering markers
        Object.values(timerIntervals.current).forEach(clearInterval);
        timerIntervals.current = {};

        // Check if Google Maps is available
        if (!window.google?.maps) {
          console.warn('⚠️ Google Maps not available, showing fallback');
          return (
            <div className="mobile-map-container">
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                padding: '20px',
                textAlign: 'center'
              }}>
                <h3>🗺️ Map Unavailable</h3>
                <p>Google Maps is currently loading or unavailable.</p>
                <p>Found {locationData.length} locations in your area.</p>
                <div style={{marginTop: '20px'}}>
                  <button onClick={() => window.location.reload()}>🔄 Reload</button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="mobile-map-container">
            {/* Location Type Filter */}
            <div className="mobile-location-filter">
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
            
            {/* Search Radius Indicator */}
            <div className="mobile-radius-indicator">
              <span className="radius-text">
                📍 Showing locations within 5 miles
                {isFetchingLocations && <span style={{color: '#FFA726'}}> 🔄</span>}
              </span>
              <span className="location-count">({locationData.length}/25 locations)</span>
            </div>
            
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
                mapId: '51948ac5ec373e9c',
                useAdvancedMarkers: true,
                useStaticMap: false,
                gestureHandling: 'greedy' // Better touch handling
              }}
            >
              {locationData.map((location) => {
                const position = {
                  lat: Number(location.location?.coordinates?.[1]),
                  lng: Number(location.location?.coordinates?.[0])
                };

                if (advancedMarkersAvailable && window.google?.maps?.marker?.AdvancedMarkerElement) {
                  try {
                    console.log('Creating advanced marker for location:', location.id);
                    const markerElement = document.createElement('div');
                    markerElement.className = 'custom-marker mobile-marker';
                    
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

                    // Add animations
                    markerElement.addEventListener('click', () => {
                      markerElement.classList.add('bounce');
                      setTimeout(() => {
                        markerElement.classList.remove('bounce');
                      }, 1000);
                    });

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
                            timerElement.innerText = `⏳ ${timeString}`;
                          }
                        }, 1000);
                        timerIntervals.current[location.id] = intervalId;
                      }
                    }

                    advancedMarker.addListener('click', () => handleMarkerClick(location));

                    return null;
                  } catch (error) {
                    console.error('Error creating marker:', error);
                    return null;
                  }
                }

                return (
                  <Marker
                    key={location.id}
                    position={position}
                    title={location.content?.text}
                    onClick={() => handleMarkerClick(location)}
                  />
                );
              })}

              {/* Info Window */}
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
            
            {/* Floating action buttons */}
            <div className="mobile-fab-container">
              <button 
                className="mobile-fab location-fab"
                onClick={getCurrentLocation}
                aria-label="Get current location"
              >
                📍
              </button>
            </div>
          </div>
        );
        
      case 'profile':
        return (
          <div className="mobile-profile-container">
            <ProfilePage 
              user={user} 
              onLocationUpdate={fetchLocations}
              isRegistering={isRegistering}
              handleAuth={handleAuth}
              isMobile={true}
            />
          </div>
        );
        
      case 'admin':
        if (user?.isAdmin) {
          return (
            <div className="mobile-admin-container">
              <AdminDashboard 
                isMobile={true}
                user={user}
              />
            </div>
          );
        }
        return (
          <div className="mobile-unauthorized">
            <h2>Unauthorized</h2>
            <p>You don't have permission to access this area.</p>
            <button 
              onClick={() => setActiveTab('map')}
              className="mobile-back-button"
            >
              Back to Map
            </button>
          </div>
        );
        
      default:
        return (
          <div className="mobile-error">
            <h2>Error</h2>
            <p>Unknown tab selected.</p>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
        <GoogleMapsProvider>
          <div className="mobile-app-container">
            {console.log('🏗️ Rendering main app container')}
            {/* Debug overlay - remove this in production */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{
                position: 'fixed',
                top: '10px',
                left: '10px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                padding: '10px',
                borderRadius: '5px',
                fontSize: '12px',
                zIndex: 9999,
                maxWidth: '300px'
              }}>
                <div>🔍 Debug Info:</div>
                <div>Platform: {typeof window !== 'undefined' && window.Capacitor ? 'Capacitor' : 'Web'}</div>
                <div>User: {user ? 'Logged In' : 'Not Logged In'}</div>
                <div>Admin: {user?.isAdmin ? 'Yes' : 'No'}</div>
                <div>Active Tab: {activeTab}</div>
                <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
                <button 
                  onClick={() => setActiveTab('map')}
                  style={{margin: '5px', padding: '2px 5px'}}
                >
                  Map
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  style={{margin: '5px', padding: '2px 5px'}}
                >
                  Profile
                </button>
                <button 
                  onClick={() => setActiveTab('admin')}
                  style={{margin: '5px', padding: '2px 5px'}}
                >
                  Admin
                </button>
              </div>
            )}
            
            {renderContent()}
            
            {/* Badge notifications */}
            {newBadges.length > 0 && (
              <BadgeNotification 
                badges={newBadges} 
                onClose={() => setNewBadges([])} 
              />
            )}
            
            {/* Mobile bottom navigation */}
            <div className="mobile-bottom-nav">
              <button 
                className={`nav-button ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                🗺️ Map
              </button>
              
              <button 
                className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                👤 Profile
              </button>
              
              {user?.isAdmin && (
                <button 
                  className={`nav-button ${activeTab === 'admin' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admin')}
                >
                  ⚙️ Admin
                </button>
              )}
              
              <button 
                className="nav-button logout"
                onClick={handleLogout}
              >
                🚪 Logout
              </button>
            </div>
          </div>
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
    console.error('Mobile App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mobile-error-boundary">
          <h2>Something went wrong</h2>
          <p>Please restart the application.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mobile-reload-button"
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const getProfileImage = (location) => {
  if (location.content?.isAnonymous) {
    return '/images/anonymous-profile.jpg';
  }
  return location.creator?.profile?.pictureUrl 
    ? `${API_URL}/${location.creator.profile.pictureUrl}`
    : null;
};

const AppMobileWithRouter = () => (
  <MemoryRouter>
    <AppMobile />
  </MemoryRouter>
);

export default AppMobile;
