import React, { useState } from 'react';
import MessageCompose from './MessageCompose';
import '../../styles/MessageButton.css';

const MessageButton = ({ 
  recipientId, 
  recipientName, 
  locationId = null, 
  locationText = null,
  className = '',
  children = null,
  onMessageSent = null
}) => {
  const [showCompose, setShowCompose] = useState(false);

  const handleClick = (e) => {
    e.stopPropagation();
    setShowCompose(true);
  };

  const handleMessageSent = () => {
    setShowCompose(false);
    if (onMessageSent) {
      onMessageSent();
    }
  };

  const handleClose = () => {
    setShowCompose(false);
  };

  return (
    <>
      <button
        className={`message-button ${className}`}
        onClick={handleClick}
        title={`Message ${recipientName || 'user'}`}
      >
        {children || '💬 Message'}
      </button>

      {showCompose && (
        <MessageCompose
          recipientId={recipientId}
          recipientName={recipientName}
          locationId={locationId}
          locationText={locationText}
          onMessageSent={handleMessageSent}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default MessageButton; 