import { useEffect, useState } from 'react';
import { useGoogleMap } from '@react-google-maps/api';

export function AdvancedMarker({ position, onClick, onMouseOver, onMouseOut }) {
  const map = useGoogleMap();
  const [marker, setMarker] = useState(null);

  useEffect(() => {
    if (!map || !window.google) return;

    const createMarker = async () => {
      try {
        // Access google through window object
        const { AdvancedMarkerElement } = await window.google.maps.importLibrary("marker");
        
        const newMarker = new AdvancedMarkerElement({
          map,
          position,
          title: 'Location',
        });

        // Add event listeners
        newMarker.addListener('click', onClick);
        newMarker.addListener('mouseover', onMouseOver);
        newMarker.addListener('mouseout', onMouseOut);

        setMarker(newMarker);
      } catch (error) {
        console.error('Error creating advanced marker:', error);
        // Log detailed error info
        console.debug('Map state:', map);
        console.debug('Google API state:', window.google?.maps);
      }
    };

    createMarker();

    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [map, position, onClick, onMouseOver, onMouseOut]);

  return null;
} 