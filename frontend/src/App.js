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
import UserLocationsPage from './components/admin/UserLocationsPage';
import './styles/markers.css';
import PROFILE_TYPES from './constants/profileTypes';
import LOCATION_TYPES from './constants/locationTypes';
import LocationForm from './components/LocationForm';
import CommentSection from './components/CommentSection';
import MessageButton from './components/messaging/MessageButton';
import KeywordsDisplay from './components/KeywordsDisplay';
import KeywordSearch from './components/KeywordSearch';
import KeywordSearchCompact from './components/KeywordSearchCompact';
import LocationShareModal from './components/shared/LocationShareModal';

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

function InfoBoxModal({ marker, onClose, user, handleDeleteLocation, handleVoteUpdate, API_URL }) {
  const [showShare, setShowShare] = useState(false);
  if (!marker) return null;
  return (
    <div style={{
      position: 'fixed',
      top: '120px', // just below filter panel
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 2000,
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      maxWidth: '400px',
      width: '90vw',
      maxHeight: '80vh',
      overflowY: 'auto',
      padding: '24px',
      border: '1px solid #eee',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          fontSize: 28,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#d32f2f',
          fontWeight: 'bold',
          zIndex: 10,
        }}
        aria-label="Close info box"
      >
        ×
      </button>
      <div className="marker-header">
        <div className="poster-info">
          <p className="poster-name">
            {marker.content.isAnonymous
              ? 'Posted anonymously'
              : `Posted by: ${marker.creator?.profile?.name || 'Unknown User'}`}
          </p>
          <p className="post-date">
            {new Date(marker.createdAt).toLocaleDateString()}
          </p>
          
          {/* Voting buttons - always shown for all locations */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <VoteButtons location={marker} onVoteUpdate={handleVoteUpdate} />
            
            {/* Message button - only shown for non-anonymous posts */}
            {!marker.content.isAnonymous && marker.creator && user && marker.creator.id !== user.id && (
              <MessageButton
                recipientId={marker.creator.id}
                recipientName={marker.creator.profile?.name || marker.creator.email}
                locationId={marker.id}
                locationText={marker.content.text}
                className="small"
                onMessageSent={() => {
                  console.log('Message sent successfully from map');
                }}
              >
                Send Message
              </MessageButton>
            )}
            
            {/* Location type badge */}
            <span style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              padding: '4px 10px',
              fontWeight: 'bold',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid #e0e0e0',
            }}>
              {LOCATION_TYPES[marker.locationType]?.icon || '📍'} {LOCATION_TYPES[marker.locationType]?.label || 'General'}
            </span>
          </div>
        </div>
        <div className="marker-stats"></div>
      </div>
      <div style={{ position: 'relative' }}>
        <div className="location-badges-container">
          <div className="marker-stats-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
            {marker.credits > 0 && (
              <div className="credits-badge">
                $ {marker.credits}
              </div>
            )}
            <div className="points-badge">
              {marker.upvotes - marker.downvotes} pts
            </div>
            <div style={{ flex: 1 }} /> {/* Spacer to push Share button to the right */}
            <button onClick={() => setShowShare(true)}>Share</button>
            {showShare && (
              <LocationShareModal link={`${window.location.origin}/location/${marker.id}`} onClose={() => setShowShare(false)} />
            )}
          </div>
        </div>
      </div>
      <p>{marker.content.text}</p>
      
      {/* Keywords Display */}
      <KeywordsDisplay keywords={marker.keywords} maxDisplay={5} />
      
      {marker.content.mediaUrls && marker.content.mediaUrls.length > 0 && (
        <div className="media-gallery">
          {marker.content.mediaUrls.map((url, index) => {
            const mediaType = marker.content.mediaTypes[index];
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
      {user && (user.isAdmin || user.id === marker.creatorId) && (
        <button
          onClick={() => handleDeleteLocation(marker.id)}
          className="delete-button"
        >
          Delete Location
        </button>
      )}
      <CommentSection
        locationId={marker.id}
        user={user}
        onNewBadges={(newBadges) => {
          if (newBadges && newBadges.length > 0) {
            console.log('New badges from comments:', newBadges);
          }
        }}
      />
    </div>
  );
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
  const [keywordSearch, setKeywordSearch] = useState('');
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);
  const [cameFromAdmin, setCameFromAdmin] = useState(false);
  const currentFetchController = useRef(null);
  const isUpdatingMarkers = useRef(false);
  const isUpdatingCenter = useRef(false);
  const infoBoxRef = useRef(null);
  const [infoBoxHeight, setInfoBoxHeight] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [mapType, setMapType] = useState('roadmap');
  const [locationLimitReached, setLocationLimitReached] = useState(false);

  // Refs to store current filter state for viewport changes
  const currentSelectedTypeRef = useRef(selectedLocationType);
  const currentKeywordSearchRef = useRef(keywordSearch);

  // Update refs when state changes
  useEffect(() => {
    currentSelectedTypeRef.current = selectedLocationType;
  }, [selectedLocationType]);

  useEffect(() => {
    currentKeywordSearchRef.current = keywordSearch;
  }, [keywordSearch]);

  const mapStyles = {
    height: "100vh",
    width: "100%"
  };

  // Get user's current location when they log in
  useEffect(() => {
    const getUserLocation = async () => {
      if (!user) return; // Only get location when user is logged in
      
      console.log('📍 Starting location check for logged-in user...');
      
      if (!navigator.geolocation) {
        console.log('📍 Geolocation not supported by browser, using default center');
        return;
      }

      try {
        console.log('📍 Requesting current position...');
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // Cache for 1 minute
          });
        });

        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        console.log('📍 Setting initial center to user location:', userLocation);
        setCenter(userLocation);
      } catch (error) {
        console.warn('⚠️ Could not get current location, using default center:', error);
        // Keep the default center
      }
    };

    getUserLocation();
  }, [user]);

  // Function to get current location manually
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };

      console.log('📍 Setting center to user location:', userLocation);
      setCenter(userLocation);

      if (mapRef.current) {
        mapRef.current.panTo(userLocation);
        mapRef.current.setZoom(15);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Could not get your current location. Please check your permissions.');
    } finally {
      setIsGettingLocation(false);
    }
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

  // Handle admin view location functionality
  useEffect(() => {
    const adminViewLocation = localStorage.getItem('adminViewLocation');
    const fromAdmin = localStorage.getItem('cameFromAdmin');
    
    if (adminViewLocation && map) {
      try {
        const adminLocationData = JSON.parse(adminViewLocation);
        const { lat, lng, locationId } = adminLocationData;
        
        console.log('🗺️ Admin view location:', adminLocationData);
        
        // Set the came from admin flag
        if (fromAdmin === 'true') {
          setCameFromAdmin(true);
        }
        
        // Center the map on the location using the same logic as marker clicks
        setCenter({ lat, lng });
        map.setCenter({ lat, lng });
        map.setZoom(15); // Zoom in closer for better visibility
        
        // Use the same centering logic as marker clicks for consistency
        panMapToShowInfoBox(lat, lng);
        
        // Find and select the location marker from the locationData state
        const location = locationData.find(loc => loc.id === locationId);
        if (location) {
          setSelectedMarker(location);
          console.log('✅ Found and selected location marker:', location);
        } else {
          console.log('⚠️ Location not found in current locationData, waiting for data to load...');
        }
        
        // Clear the stored location data
        localStorage.removeItem('adminViewLocation');
        localStorage.removeItem('cameFromAdmin');
        
      } catch (error) {
        console.error('Error handling admin view location:', error);
        localStorage.removeItem('adminViewLocation');
        localStorage.removeItem('cameFromAdmin');
      }
    }
  }, [map, locationData]);

  // Handle admin view location when locationData becomes available
  useEffect(() => {
    const adminViewLocation = localStorage.getItem('adminViewLocation');
    const fromAdmin = localStorage.getItem('cameFromAdmin');
    
    if (adminViewLocation && fromAdmin === 'true' && locationData.length > 0) {
      try {
        const adminLocationData = JSON.parse(adminViewLocation);
        const { locationId } = adminLocationData;
        
        // Find and select the location marker from the locationData state
        const location = locationData.find(loc => loc.id === locationId);
        if (location) {
          setSelectedMarker(location);
          console.log('✅ Found and selected location marker after data load:', location);
          
          // Clear the stored location data
          localStorage.removeItem('adminViewLocation');
          localStorage.removeItem('cameFromAdmin');
        }
      } catch (error) {
        console.error('Error handling admin view location after data load:', error);
        localStorage.removeItem('adminViewLocation');
        localStorage.removeItem('cameFromAdmin');
      }
    }
  }, [locationData]);

  // Clear cameFromAdmin flag when user logs out or navigates away
  useEffect(() => {
    if (!user) {
      setCameFromAdmin(false);
    }
  }, [user]);

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
      
      // Pan the map to ensure the location form is fully visible
      panMapToShowForm(clickedLat, clickedLng);
    }
  };

  // Function to pan the map so the clicked point is at the bottom 10% of the screen
  const panMapToShowForm = (lat, lng) => {
    if (!mapRef.current) return;

    try {
      const map = mapRef.current;
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const mapDiv = map.getDiv();
      const mapHeight = mapDiv.clientHeight;

      // Place the clicked point at 90% from the top (0 = top, 1 = bottom)
      const desiredScreenYRatio = 0.9;
      const latSpan = ne.lat() - sw.lat();
      const latOffset = latSpan * (0.5 - desiredScreenYRatio);

      const newLat = lat - latOffset;
      const newLng = lng;

      map.panTo({ lat: newLat, lng: newLng });
    } catch (error) {
      console.error('❌ Error panning map to show form:', error);
    }
  };

  // Function to pan the map so the top of the info box is just below the filter panel
  const panMapToShowInfoBox = (lat, lng) => {
    if (!mapRef.current) return;

    try {
      const map = mapRef.current;
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();

      const mapDiv = map.getDiv();
      const mapHeight = mapDiv.clientHeight;

      // Get the filter panel height in pixels
      const filterPanel = document.querySelector('.location-filter');
      const panelHeight = filterPanel ? filterPanel.getBoundingClientRect().height : 0;

      // Calculate the ratio of the panel height to the map height
      const panelRatio = panelHeight / mapHeight;
      // Convert this ratio to a latitude offset
      const latSpan = ne.lat() - sw.lat();
      const latOffset = latSpan * panelRatio;

      // Pan so the marker's top aligns just below the filter panel
      const newLat = lat - latOffset;
      const newLng = lng;

      map.panTo({ lat: newLat, lng: newLng });
    } catch (error) {
      console.error('❌ Error panning map to show info box:', error);
    }
  };

  const handleMarkerClick = (location) => {
    console.log('Clicked location full data:', JSON.stringify(location, null, 2));
    console.log('Media URLs:', location.content.mediaUrls);
    console.log("Marker clicked:", location); // Debug log
    setSelectedMarker(location);
    setSelectedLocation(null); // Close any new location form
    
    // Center the map to show the info box properly
    const lat = Number(location.location.coordinates[1]);
    const lng = Number(location.location.coordinates[0]);
    panMapToShowInfoBox(lat, lng);
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
      data.append('keywords', JSON.stringify(formData.keywords || []));
      
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

  // Fetch locations with viewport-based filtering (like Zillow)
  const fetchLocations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🗺️ Fetching locations - Token exists:', !!token);
      console.log('🗺️ Fetching locations - User exists:', !!user);
      console.log('🗺️ Fetching locations - Selected type:', currentSelectedTypeRef.current);
      console.log('🗺️ Fetching locations - Keyword search:', currentKeywordSearchRef.current);
      
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
      
      // Apply filters: location type OR keyword search (mutually exclusive)
      if (currentKeywordSearchRef.current.trim()) {
        // If keyword search is active, search by keyword (overrides location type)
        url.searchParams.append('keywords', currentKeywordSearchRef.current.trim());
        url.searchParams.append('user', currentKeywordSearchRef.current.trim()); // Also search by user email/name
        console.log('🔍 Keyword search active - searching by keyword and user:', currentKeywordSearchRef.current.trim());
      } else if (currentSelectedTypeRef.current !== 'all') {
        // If no keyword search, filter by location type
        url.searchParams.append('locationType', currentSelectedTypeRef.current);
        console.log('🔍 Location type filter active:', currentSelectedTypeRef.current);
      } else {
        console.log('🔍 No filters active - showing all locations');
      }
      
      // Get current map bounds for viewport-based filtering
      if (mapRef.current) {
        const bounds = mapRef.current.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          
          url.searchParams.append('north', ne.lat().toString());
          url.searchParams.append('south', sw.lat().toString());
          url.searchParams.append('east', ne.lng().toString());
          url.searchParams.append('west', sw.lng().toString());
          
          console.log('🗺️ Fetching locations for viewport:', {
            north: ne.lat(),
            south: sw.lat(),
            east: ne.lng(),
            west: sw.lng(),
            zoom: mapRef.current.getZoom()
          });
        }
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: currentFetchController.current.signal
      });
      
      console.log('🗺️ Locations API URL:', url.toString());
      console.log('🗺️ Locations API response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      console.log('🗺️ Locations fetched successfully:', data.length, 'locations');
      
      // Check if we hit the limit and need to warn the user
      if (data.length >= 25) {
        console.log('⚠️ Location limit reached - suggesting user zoom in');
        setLocationLimitReached(true);
      } else {
        setLocationLimitReached(false);
      }
      
      // Force marker update by temporarily clearing the flag
      isUpdatingMarkers.current = false;
      setLocationData(data);
      
      // Ensure markers are recreated after data update
      setTimeout(() => {
        if (map && data.length > 0) {
          console.log('🔄 Forcing marker recreation after data update');
          isUpdatingMarkers.current = false;
        }
      }, 200);
      
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
  }, [user, map]);

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
        
        // Throttle the location refresh to prevent excessive API calls
        boundsChangeTimeout = setTimeout(() => {
          console.log('🗺️ Map viewport changed, refreshing locations');
          fetchLocations();
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
          <div class="marker-stats" style="display: flex; align-items: center; gap: 10px; flex-direction: row;">
            <span class="votes" style="display: inline-flex; align-items: center;">⬆️ ${location.upvotes || 0}</span>${location.credits > 0 ? `<span class="credits" style="display: inline-flex; align-items: center;">💵 ${location.credits}</span>` : ''}
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

  // Pan map when location form opens to ensure it's visible
  useEffect(() => {
    if (selectedLocation && mapRef.current) {
      // Add a small delay to ensure the form has rendered
      const timer = setTimeout(() => {
        panMapToShowForm(selectedLocation.lat, selectedLocation.lng);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [selectedLocation]);

  // Fetch locations when user is set
  useEffect(() => {
    if (user) {
      console.log('Fetching locations for user:', user);
      fetchLocations();
    }
  }, [user, fetchLocations]);

  // Trigger fetch when location type changes
  useEffect(() => {
    if (user && map) {
      console.log('🔍 Location type changed, fetching locations');
      fetchLocations();
    }
  }, [selectedLocationType, user, map, fetchLocations]);

  // Trigger fetch when keyword search changes
  useEffect(() => {
    if (user && map) {
      console.log('🔍 Keyword search changed, fetching locations');
      fetchLocations();
    }
  }, [keywordSearch, user, map, fetchLocations]);

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
            {cameFromAdmin && user?.isAdmin && (
              <button 
                onClick={() => {
                  setCameFromAdmin(false);
                  window.location.href = '/admin';
                }} 
                className="back-to-admin-button"
              >
                ⬅️ Back to Admin
              </button>
            )}
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
                  className={`filter-button ${selectedLocationType === 'all' && !keywordSearch.trim() ? 'active' : ''} ${keywordSearch.trim() ? 'keyword-search-active' : ''}`}
                  onClick={() => {
                    setSelectedLocationType('all');
                    setKeywordSearch(''); // Clear keyword search when selecting "All"
                  }}
                >
                  {keywordSearch.trim() ? `🔍 "${keywordSearch}"` : '🌍 All'}
                </button>
                <button 
                  className="filter-button circle-icon-button"
                  onClick={getCurrentLocation}
                  title="Center map on my location"
                  disabled={isGettingLocation}
                >
                  📍
                </button>
                {Object.entries(LOCATION_TYPES).map(([key, type]) => (
                  <button 
                    key={key}
                    className={`filter-button ${selectedLocationType === key && !keywordSearch.trim() ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedLocationType(key);
                      setKeywordSearch(''); // Clear keyword search when selecting a type
                    }}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
              
              {/* Keyword Search and Refresh */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeywordSearchCompact
                  onSearch={(searchTerm) => {
                    setKeywordSearch(searchTerm);
                    if (searchTerm.trim()) {
                      setSelectedLocationType('all'); // Clear location type when keyword search is active
                    }
                  }}
                  placeholder="Search keywords..."
                />
                
                {/* Refresh Locations Button */}
                <button
                  style={{
                    background: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '13px',
                    height: '32px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#388e3c'}
                  onMouseLeave={(e) => e.target.style.background = '#4CAF50'}
                  onClick={() => {
                    console.log('🔄 Manual location refresh triggered');
                    isUpdatingMarkers.current = false;
                    fetchLocations();
                  }}
                  title="Refresh locations for current map view"
                >
                  🔄 Refresh
                </button>
              </div>
              
              <div className="location-count-display">
                <span className="count-text">
                  📍 {locationData.length}/25 locations in current view
                  {isFetchingLocations && <span style={{color: '#FFA726'}}> 🔄</span>}
                </span>
                {locationLimitReached && (
                  <div style={{
                    color: '#FF5722',
                    fontSize: '12px',
                    marginTop: '4px',
                    fontWeight: 'bold'
                  }}>
                    ⚠️ Too many locations! Zoom in to see more details.
                  </div>
                )}
                <div style={{
                  color: '#666',
                  fontSize: '11px',
                  marginTop: '2px',
                  fontStyle: 'italic'
                }}>
                  Locations update automatically as you move the map
                </div>
              </div>
            </div>
          )}
          
          <div className="map-container" style={{ position: 'relative' }}>
            <button
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                background: '#fff',
                border: '1px solid #ccc',
                borderRadius: '6px',
                padding: '8px 14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
            >
              {mapType === 'roadmap' ? '🛰️ Satellite View' : '🗺️ Map View'}
            </button>
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
                mapTypeId: mapType,
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
                <InfoBoxModal
                  marker={selectedMarker}
                  onClose={() => setSelectedMarker(null)}
                  user={user}
                  handleDeleteLocation={handleDeleteLocation}
                  handleVoteUpdate={handleVoteUpdate}
                  API_URL={API_URL}
                />
              )}
            </GoogleMap>
          </div>
        </div>
      )
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
    {
      path: "/admin/user/:userId/locations",
      element: user?.isAdmin ? <UserLocationsPage /> : <Navigate to="/" />,
    },
  ]), [user, center, locationData, selectedLocation, selectedMarker, selectedLocationType, keywordSearch, handleLogout, handleMapClick, handleLocationSubmit, submitting, handleVoteUpdate, handleDeleteLocation, handleLoginSuccess, fetchLocations, getCurrentLocation, isFetchingLocations, locationLimitReached, mapType, handleMapLoad, handleMapUnmount]);

  console.log("Render App:", { selectedMarker: selectedMarker, selectedLocation, routerPath});

  // Measure info box height after render
  useEffect(() => {
    if (selectedMarker) {
      let attempts = 0;
      const maxAttempts = 20; // 20 * 50ms = 1s
      function tryMeasure() {
        if (infoBoxRef.current) {
          const measuredHeight = infoBoxRef.current.getBoundingClientRect().height;
          console.log('[InfoBox] Measured info box height:', measuredHeight);
          setInfoBoxHeight(measuredHeight);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(tryMeasure, 50);
        } else {
          console.log('[InfoBox] Ref is still null after polling, could not measure info box height.');
        }
      }
      tryMeasure();
    }
  }, [selectedMarker]);

  // Smart pan function
  const panMapToShowInfoBoxSmart = (lat, lng, boxHeightPx) => {
    if (!mapRef.current) return;
    try {
      const map = mapRef.current;
      const bounds = map.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const mapDiv = map.getDiv();
      const mapHeight = mapDiv.clientHeight;
      const filterPanel = document.querySelector('.location-filter');
      const panelHeight = filterPanel ? filterPanel.getBoundingClientRect().height : 0;
      let offsetRatio;
      if (boxHeightPx + panelHeight > mapHeight) {
        offsetRatio = (panelHeight + (boxHeightPx - (mapHeight - panelHeight))) / mapHeight;
      } else {
        offsetRatio = panelHeight / mapHeight;
      }
      const latSpan = ne.lat() - sw.lat();
      const latOffset = latSpan * offsetRatio;
      const newLat = lat - latOffset;
      console.log('[InfoBox] Panning map:', {
        lat, lng, boxHeightPx, mapHeight, panelHeight, offsetRatio, latSpan, latOffset, newLat
      });
      map.panTo({ lat: newLat, lng });
    } catch (error) {
      console.error('❌ Error panning map to show info box:', error);
    }
  };

  // Pan after measuring
  useEffect(() => {
    if (selectedMarker && infoBoxHeight > 0) {
      const lat = Number(selectedMarker.location.coordinates[1]);
      const lng = Number(selectedMarker.location.coordinates[0]);
      panMapToShowInfoBoxSmart(lat, lng, infoBoxHeight);
    }
  }, [selectedMarker, infoBoxHeight]);

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