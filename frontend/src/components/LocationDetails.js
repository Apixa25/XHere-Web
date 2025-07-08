import React, { useState } from 'react';
import LocationShareModal from './shared/LocationShareModal';

const LocationDetails = ({ location }) => {
  const [showShare, setShowShare] = useState(false);
  const locationLink = `${window.location.origin}/location/${location.id}`;

  console.log('Full location object in LocationDetails:', location);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  console.log('LocationDetails - received location:', location);
  console.log('LocationDetails - media URLs:', location?.content?.mediaUrls);
  console.log('LocationDetails - media types:', location?.content?.mediaTypes);

  return (
    <div>
      <p>{location.content.text}</p>
      <button onClick={() => setShowShare(true)}>Share</button>
      {showShare && (
        <LocationShareModal link={locationLink} onClose={() => setShowShare(false)} />
      )}
      
      {/* Modified Credits Display */}
      {Number(location?.credits) > 0 && (
        <div className="credits-badge-container" style={{
          marginBottom: '10px',
          marginTop: '5px'
        }}>
          <div className="credits-badge">
            $ {location.credits} {location.credits === 1 ? 'Credit' : 'Credits'} Available
          </div>
        </div>
      )}

      {location.content.mediaUrls && location.content.mediaUrls.map((url, index) => {
        const mediaType = location.content.mediaTypes?.[index];
        const fullUrl = url.startsWith('http') ? url : `${API_URL}/${url}`;
        
        console.log('Attempting to render media:', { url: fullUrl, type: mediaType });

        if (mediaType?.startsWith('video/')) {
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
              alt={`Location media ${index + 1}`}
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'cover',
                marginBottom: '10px',
                borderRadius: '4px'
              }}
              onError={(e) => console.error('Image failed to load:', url)}
            />
          );
        }
      })}
    </div>
  );
};

export default LocationDetails; 