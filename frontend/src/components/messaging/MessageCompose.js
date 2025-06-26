import React, { useState, useEffect, useRef } from 'react';
import messageService from '../../services/messageService';
import api from '../../services/api';
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
  
  // User search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Auto-generate subject if it's about a location
  useEffect(() => {
    if (locationText && !subject) {
      const shortText = locationText.length > 30 
        ? locationText.substring(0, 30) + '...' 
        : locationText;
      setSubject(`Re: ${shortText}`);
    }
  }, [locationText, subject]);

  // Initialize with provided recipient data
  useEffect(() => {
    if (recipientId && recipientName) {
      setSelectedUser({
        id: recipientId,
        displayName: recipientName,
        email: recipientName.includes('@') ? recipientName : null,
        username: !recipientName.includes('@') ? recipientName : null
      });
      setSearchQuery(recipientName);
    }
  }, [recipientId, recipientName]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setSelectedUser(null);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      if (query.length >= 2) {
        performSearch(query);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    setSearchTimeout(timeout);
  };

  // Perform user search
  const performSearch = async (query) => {
    try {
      setIsSearching(true);
      setShowDropdown(true);
      const results = await api.searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle user selection from dropdown
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.displayName);
    setShowDropdown(false);
    setSearchResults([]);
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      setError('Please select a recipient');
      return;
    }

    if (!content.trim()) {
      setError('Message content is required');
      return;
    }

    setSending(true);
    setError('');

    try {
      await messageService.sendMessage(
        selectedUser.id, 
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
      setSelectedUser(null);
      setSearchQuery('');
      
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
            <div className="recipient-search-container" ref={dropdownRef}>
              <input
                ref={searchInputRef}
                type="text"
                id="recipient"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search by name or email..."
                className="recipient-input"
                autoComplete="off"
              />
              
              {showDropdown && (
                <div className="search-dropdown">
                  {isSearching ? (
                    <div className="search-loading">
                      🔍 Searching...
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="search-result-item"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="user-info">
                          <div className="user-display-name">
                            {user.displayName}
                          </div>
                          <div className="user-details">
                            <span className="email">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : searchQuery.length >= 2 ? (
                    <div className="no-results">
                      No users found
                    </div>
                  ) : null}
                </div>
              )}
            </div>
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
              disabled={sending || !content.trim() || !selectedUser}
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