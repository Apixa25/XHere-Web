import React, { useState, useEffect } from 'react';
import messageService from '../../services/messageService';
import '../../styles/MessageCompose.css';

const MessageCompose = ({ 
  recipientId, 
  recipientName, 
  locationId = null, 
  locationText = null,
  onMessageSent, 
  onClose 
}) => {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate subject if it's about a location
  useEffect(() => {
    if (locationText && !subject) {
      const shortText = locationText.length > 30 
        ? locationText.substring(0, 30) + '...' 
        : locationText;
      setSubject(`Re: ${shortText}`);
    }
  }, [locationText, subject]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Message content is required');
      return;
    }

    setSending(true);
    setError('');

    try {
      await messageService.sendMessage(
        recipientId, 
        subject || 'New Message', 
        content, 
        locationId
      );
      
      if (onMessageSent) {
        onMessageSent();
      }
      
      // Reset form
      setSubject('');
      setContent('');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      setError(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="message-compose-overlay">
      <div className="message-compose-modal">
        <div className="message-compose-header">
          <h3>💬 Send Message</h3>
          <button 
            className="close-button" 
            onClick={handleCancel}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="message-compose-form">
          <div className="form-group">
            <label htmlFor="recipient">To:</label>
            <input
              type="text"
              id="recipient"
              value={recipientName || 'Unknown User'}
              disabled
              className="recipient-input"
            />
          </div>

          {locationText && (
            <div className="form-group">
              <label>About Location:</label>
              <div className="location-context">
                📍 {locationText}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="subject-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Message:</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              rows="6"
              className="content-textarea"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              onClick={handleCancel}
              className="cancel-button"
              disabled={sending}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="send-button"
              disabled={sending || !content.trim()}
            >
              {sending ? '📤 Sending...' : '📤 Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessageCompose; 