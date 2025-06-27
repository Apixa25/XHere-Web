import VoteButtons from '../VoteButtons';
import MessageButton from '../messaging/MessageButton';
import KeywordsDisplay from '../KeywordsDisplay';
import React, { useState } from "react";
import LocationShareModal from "./LocationShareModal";

const LocationCard = ({ location, onEdit, onDelete, compact = false }) => {
  const [showShare, setShowShare] = useState(false);
  const locationLink = `${window.location.origin}/location/${location.id}`;

  const getStatusBadge = () => {
    switch(location.verificationStatus) {
      case 'verified':
        return (
          <div style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'inline-block'
          }}>
            ✓ Verified
          </div>
        );
      case 'pending':
        return (
          <div style={{
            backgroundColor: '#FFA726',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            display: 'inline-block'
          }}>
            ⏳ Pending Verification
          </div>
        );
      default:
        return null;
    }
  };

  const getRemainingTime = () => {
    if (!location.deleteAt) return null;
    
    const now = new Date();
    const deleteAt = new Date(location.deleteAt);
    const diff = deleteAt - now;
    
    if (diff <= 0) return 'Expiring soon...';
    
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} days remaining`;
    if (hours > 0) return `${hours} hours remaining`;
    return `${minutes} minutes remaining`;
  };

  // Get current user id safely
  const currentUserId = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'))?.id;
    } catch {
      return null;
    }
  })();

  // Get creator id safely (prefer creator.id, fallback to creatorId)
  const creatorId = location.creator?.id || location.creatorId;

  // Debug log
  console.log('DEBUG: Current user id:', currentUserId, 'Creator id:', creatorId);

  return (
    <div
      key={location.id}
      style={{
        width: '275px',
        minHeight: '275px',
        maxHeight: editingLocation?._id === location._id ? 'none' : '275px',
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        margin: '0 auto',
        position: 'relative',
        marginBottom: '20px'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: compact ? '14px' : '16px',
            marginBottom: '4px'
          }}>
            {location.content.text}
          </div>
          
          {/* Keywords Display */}
          <KeywordsDisplay keywords={location.keywords} maxDisplay={3} />
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginTop: '8px'
          }}>
            <div style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {location.totalPoints || 0} pts
            </div>
            {getStatusBadge()}
          </div>

          {/* Voting and Message row */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '10px',
            margin: '12px 0'
          }}>
            <VoteButtons location={location} onVoteUpdate={() => {}} />
            {/* Only show MessageButton if not the creator (current user) */}
            {currentUserId && creatorId && currentUserId !== creatorId && (
              <MessageButton
                recipientId={creatorId}
                recipientName={location.creator?.profile?.name || location.creator?.email}
                locationId={location.id}
                locationText={location.content.text}
                className="small"
              >
                Send Message
              </MessageButton>
            )}
          </div>
          
          {/* ... rest of the existing code ... */}

          {location.autoDelete && (
            <div style={{
              fontSize: '12px',
              color: '#ff6b6b',
              marginTop: '4px'
            }}>
              ⏳ {getRemainingTime()}
            </div>
          )}

          {location.credits > 0 && (
            <div style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              display: 'inline-block',
              marginLeft: '8px'
            }}>
              $ {location.credits} Credits Available
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: '10px'
          }}>
            {getStatusBadge()}
            {getRemainingTime() && (
              <div style={{
                color: '#666',
                fontSize: '12px'
              }}>
                {getRemainingTime()}
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={() => setShowShare(true)}>Share</button>
      {showShare && (
        <LocationShareModal link={locationLink} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
};

export default LocationCard;