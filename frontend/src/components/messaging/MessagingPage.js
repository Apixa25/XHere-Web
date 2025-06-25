import React, { useState, useEffect } from 'react';
import MessageList from './MessageList';
import MessageCompose from './MessageCompose';
import messageService from '../../services/messageService';
import '../../styles/MessagingPage.css';

const MessagingPage = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { count } = await messageService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleComposeMessage = (recipientId, recipientName, locationId = null, locationText = null) => {
    setComposeData({
      recipientId,
      recipientName,
      locationId,
      locationText
    });
    setShowCompose(true);
  };

  const handleMessageSent = () => {
    setShowCompose(false);
    setComposeData(null);
    // Refresh the message list
    // The MessageList component will refetch when activeTab changes
    setActiveTab(activeTab); // This triggers a re-render
    fetchUnreadCount();
  };

  const handleCloseCompose = () => {
    setShowCompose(false);
    setComposeData(null);
  };

  return (
    <div className="messaging-page">
      <div className="messaging-header">
        <h2>💬 Messages</h2>
        <div className="header-actions">
          <button 
            className="compose-button"
            onClick={() => setShowCompose(true)}
          >
            ✏️ Compose
          </button>
          <button 
            className="close-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="messaging-tabs">
        <button
          className={`tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          📥 Inbox
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          📤 Sent
        </button>
      </div>

      <div className="messaging-content">
        <MessageList 
          activeTab={activeTab}
          onComposeMessage={handleComposeMessage}
        />
      </div>

      {showCompose && (
        <MessageCompose
          recipientId={composeData?.recipientId}
          recipientName={composeData?.recipientName}
          locationId={composeData?.locationId}
          locationText={composeData?.locationText}
          onMessageSent={handleMessageSent}
          onClose={handleCloseCompose}
        />
      )}
    </div>
  );
};

export default MessagingPage; 