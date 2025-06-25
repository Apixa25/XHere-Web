import React from 'react';
import '../../styles/MessageDetail.css';

const MessageDetail = ({ message, onClose, onDelete, activeTab, onReply }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getUserDisplayName = (user) => {
    return user?.profile?.name || user?.email || 'Unknown User';
  };

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    } else {
      onClose();
    }
  };

  return (
    <div className="message-detail-overlay">
      <div className="message-detail-modal">
        <div className="message-detail-header">
          <h3>💬 Message Details</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="message-detail-content">
          <div className="message-info">
            <div className="message-field">
              <label>From:</label>
              <span>{getUserDisplayName(message.sender)}</span>
            </div>
            
            <div className="message-field">
              <label>To:</label>
              <span>{getUserDisplayName(message.recipient)}</span>
            </div>
            
            <div className="message-field">
              <label>Subject:</label>
              <span>{message.subject}</span>
            </div>
            
            <div className="message-field">
              <label>Date:</label>
              <span>{formatDate(message.createdAt)}</span>
            </div>

            {message.isRead && message.readAt && (
              <div className="message-field">
                <label>Read:</label>
                <span>{formatDate(message.readAt)}</span>
              </div>
            )}

            {message.location && (
              <div className="message-field">
                <label>About Location:</label>
                <div className="location-reference">
                  📍 {message.location.content?.text || 'Location reference'}
                </div>
              </div>
            )}
          </div>

          <div className="message-body">
            <label>Message:</label>
            <div className="message-text">
              {message.content}
            </div>
          </div>
        </div>

        <div className="message-detail-actions">
          {activeTab === 'inbox' && (
            <button 
              className="reply-button"
              onClick={handleReply}
            >
              📧 Reply
            </button>
          )}
          
          <button 
            className="delete-button"
            onClick={onDelete}
          >
            🗑️ Delete
          </button>
          
          <button 
            className="close-detail-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageDetail; 