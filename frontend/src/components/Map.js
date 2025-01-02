import React, { useState } from 'react';
import GoogleMap from 'google-map-react';
import InfoCard from './InfoCard';
import InfoWindow from 'google-map-react';
import api from '../services/api';
import BadgeNotification from './BadgeNotification';

const Map = () => {
  const [locations, setLocations] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [newBadges, setNewBadges] = useState([]);

  const handleVoteUpdate = async (updatedLocation) => {
    setLocations(locations.map(loc => 
      loc.id === updatedLocation.id ? { ...loc, ...updatedLocation } : loc
    ));

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

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <GoogleMap
        // ... existing map props ...
      >
        {/* ... existing map content ... */}
        {selectedMarker && (
          <InfoWindow
            position={{
              lat: selectedMarker.location.coordinates[1],
              lng: selectedMarker.location.coordinates[0]
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <InfoCard 
              location={selectedMarker}
              onVoteUpdate={handleVoteUpdate}
            />
          </InfoWindow>
        )}
      </GoogleMap>

      <BadgeNotification 
        badges={newBadges}
        onClose={() => setNewBadges([])}
      />
    </div>
  );
};

export default Map; 