import React, { useState } from 'react';
import GoogleMap from 'google-map-react';
import InfoCard from './InfoCard';
import InfoWindow from 'google-map-react';
import api from '../services/api';
import BadgeNotification from './BadgeNotification';
import LocationShareModal from './shared/LocationShareModal';

const Map = () => {
  const [locations, setLocations] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [newBadges, setNewBadges] = useState([]);
  const [showShare, setShowShare] = useState(false);

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
          (() => { console.log('Rendering InfoWindow for marker:', selectedMarker); return null; })() ||
          <InfoWindow
            position={{
              lat: selectedMarker.location.coordinates[1],
              lng: selectedMarker.location.coordinates[0]
            }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div>
              <InfoCard 
                location={selectedMarker}
                onVoteUpdate={handleVoteUpdate}
              />
              {(() => { console.log('Rendering Share button for marker:', selectedMarker.id); return null; })()}
              <button onClick={() => { console.log('Share button clicked for marker:', selectedMarker.id); setShowShare(true); }}>Share</button>
              {showShare && (
                (() => { console.log('Rendering LocationShareModal for marker:', selectedMarker.id); return null; })() ||
                <LocationShareModal link={`${window.location.origin}/location/${selectedMarker.id}`} onClose={() => { console.log('Closing LocationShareModal for marker:', selectedMarker.id); setShowShare(false); }} />
              )}
            </div>
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