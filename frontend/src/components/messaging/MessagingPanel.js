import React, { useState } from 'react';
import MessageList from './MessageList';
import MessageCompose from './MessageCompose';
import MessageDetail from './MessageDetail';

const MessagingPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  // Handler to open message detail
  const handleOpenDetail = (message) => {
    setSelectedMessage(message);
    setShowDetail(true);
  };

  // Handler to close message detail
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedMessage(null);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100%',
      background: '#fff',
      boxShadow: '-2px 0 12px rgba(0,0,0,0.2)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>💬 Messages</h2>
        <button 
          onClick={onClose} 
          style={{ 
            fontSize: '28px', 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            color: 'red', 
            fontWeight: 'bold',
            lineHeight: 1,
            transition: 'color 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.color = '#b30000'}
          onMouseOut={e => e.currentTarget.style.color = 'red'}
          aria-label="Close messages panel"
        >
          ✕
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
        <button onClick={() => setActiveTab('inbox')} style={{ marginRight: 8, fontWeight: activeTab === 'inbox' ? 'bold' : 'normal' }}>Inbox</button>
        <button onClick={() => setActiveTab('sent')} style={{ fontWeight: activeTab === 'sent' ? 'bold' : 'normal' }}>Sent</button>
        <button onClick={() => setShowCompose(true)} style={{ marginLeft: 16 }}>✏️ Compose</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {showDetail && selectedMessage ? (
          <MessageDetail
            message={selectedMessage}
            onClose={handleCloseDetail}
            onDelete={() => {
              handleCloseDetail();
              // Optionally, trigger a refresh in MessageList if needed
            }}
            activeTab={activeTab}
          />
        ) : !showCompose ? (
          <MessageList 
            activeTab={activeTab} 
            onOpenDetail={handleOpenDetail}
          />
        ) : (
          <MessageCompose onClose={() => setShowCompose(false)} />
        )}
      </div>
    </div>
  );
};

export default MessagingPanel; 