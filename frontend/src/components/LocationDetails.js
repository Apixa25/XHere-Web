import React from 'react';

const LocationDetails = ({ location }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  return (
    <div>
      <p>{location.content.text}</p>
      {location.content.mediaUrls && location.content.mediaUrls.map((url, index) => {
        const mediaType = location.content.mediaTypes[index];
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