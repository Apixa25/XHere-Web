import React, { useState, useEffect } from 'react';
import messageService from '../../services/messageService';
import MessageDetail from './MessageDetail';
import '../../styles/MessageList.css';

const MessageList = ({ activeTab = 'inbox', onOpenDetail }) => {
  console.log('📬 MessageList component rendered with activeTab:', activeTab);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    console.log('📬 MessageList useEffect triggered');
    console.log('📬 activeTab:', activeTab);
    fetchMessages();
  }, [activeTab, refreshKey]);

  // Add a method to force refresh
  const forceRefresh = () => {
    console.log('📬 Force refreshing messages');
    setRefreshKey(prev => prev + 1);
  };

  // Expose forceRefresh method to parent
  useEffect(() => {
    if (window.forceRefreshMessages) {
      window.forceRefreshMessages = forceRefresh;
    }
  }, []);

  const fetchMessages = async () => {
    console.log('📬 fetchMessages called for tab:', activeTab);
    setLoading(true);
    setError('');
    
    try {
      const data = activeTab === 'inbox' 
        ? await messageService.getInbox()
        : await messageService.getSent();
      
      console.log('📬 Messages fetched:', data);
      setMessages(data);
    } catch (error) {
      console.error('📬 Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    if (onOpenDetail) {
      onOpenDetail(message);
    }
    // Mark as read if it's an inbox message and unread
    if (activeTab === 'inbox' && !message.isRead) {
      try {
        await messageService.markAsRead(message.id);
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === message.id 
              ? { ...msg, isRead: true, readAt: new Date() }
              : msg
          )
        );
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await messageService.deleteMessage(messageId);
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== messageId)
        );
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getUserDisplayName = (user) => {
    return user?.profile?.name || user?.email || 'Unknown User';
  };

  if (loading) {
    return (
      <div className="message-list-container">
        <div className="loading-messages">
          📬 Loading messages...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="message-list-container">
        <div className="error-messages">
          ❌ {error}
        </div>
      </div>
    );
  }

  return (
    <div className="message-list-container">
      <div className="message-list-header">
        <h3>
          {activeTab === 'inbox' ? '📥 Inbox' : '📤 Sent Messages'}
        </h3>
        <span className="message-count">
          {messages.length} message{messages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="no-messages">
          <div className="no-messages-icon">
            {activeTab === 'inbox' ? '📭' : '📤'}
          </div>
          <p>
            {activeTab === 'inbox' 
              ? 'No messages in your inbox' 
              : 'No sent messages yet'
            }
          </p>
        </div>
      ) : (
        <div className="message-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message-item ${!message.isRead && activeTab === 'inbox' ? 'unread' : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="message-header">
                <div className="message-sender">
                  {activeTab === 'inbox' 
                    ? getUserDisplayName(message.sender)
                    : getUserDisplayName(message.recipient)
                  }
                </div>
                <div className="message-date">
                  {formatDate(message.createdAt)}
                </div>
              </div>
              
              <div className="message-subject">
                {message.subject}
                {!message.isRead && activeTab === 'inbox' && (
                  <span className="unread-indicator">●</span>
                )}
              </div>
              
              <div className="message-preview">
                {message.content.substring(0, 100)}
                {message.content.length > 100 && '...'}
              </div>

              {message.location && (
                <div className="message-location-context">
                  📍 About: {message.location.content?.text?.substring(0, 50)}...
                </div>
              )}

              <div className="message-actions">
                <button
                  className="delete-message-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMessage(message.id);
                  }}
                  title="Delete message"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageList; 