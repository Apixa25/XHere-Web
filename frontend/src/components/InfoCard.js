import React from 'react';
import VoteButtons from './VoteButtons';

const InfoCard = ({ location, onVoteUpdate }) => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  return (
    <div style={{
      padding: '15px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '300px'
    }}>
      <div style={{ 
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '4px'
      }}>
        Posted by: {location.creator?.profile?.name || 'Anonymous'}
      </div>
      <div style={{ 
        fontSize: '12px',
        marginBottom: '8px'
      }}>
        {location.content.text}
      </div>
      
      <VoteButtons 
        location={location} 
        onVoteUpdate={onVoteUpdate}
      />

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
                marginTop: '10px'
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
                marginTop: '10px',
                borderRadius: '4px'
              }}
            />
          );
        }
      })}
    </div>
  );
};

export default InfoCard;