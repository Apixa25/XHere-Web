import VoteButtons from '../VoteButtons';
import MessageButton from '../messaging/MessageButton';
import KeywordsDisplay from '../KeywordsDisplay';
import BuyLocationButton from '../BuyLocationButton';
import OwnershipStatus from '../OwnershipStatus';
import PurchaseHistory from '../PurchaseHistory';
import OfficialLocationControls from '../OfficialLocationControls';
import React, { useState } from "react";
import LocationShareModal from "./LocationShareModal";

const LocationCard = ({ location, onEdit, onDelete, compact = false }) => {
  const [showShare, setShowShare] = useState(false);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const locationLink = `${window.location.origin}/location/${location.id}`;
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLocation, setEditedLocation] = useState(location);

  const getStatusBadge = () => {
    // New location status system
    if (location.locationStatus) {
      const statusConfig = {
        pending: { color: '#FF9800', icon: '⏳', text: 'Pending' },
        verified: { color: '#4CAF50', icon: '✅', text: 'Verified' },
        flagged: { color: '#F44336', icon: '🚩', text: 'Flagged' },
        removed: { color: '#9E9E9E', icon: '🗑️', text: 'Removed' }
      };

      const config = statusConfig[location.locationStatus] || statusConfig.pending;

      return (
        <div style={{
          backgroundColor: config.color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {config.icon} {config.text}
        </div>
      );
    }

    // Legacy verification status system
    if (location.verificationStatus === 'verified') {
      return (
        <div style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          ✅ Verified
        </div>
      );
    }

    return null;
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

  const handlePurchaseSuccess = (result) => {
    console.log('Location purchased successfully:', result);
    // You can add additional logic here, like refreshing the location list
  };

  const handlePurchaseError = (error) => {
    console.error('Purchase error:', error);
    // You can add error handling logic here
  };

  const handleOfficialControlsSuccess = (result) => {
    console.log('Official controls action successful:', result);
    // Handle different types of success
    if (result.type === 'location_made_official') {
      // Update the location data if needed
      if (result.location) {
        // You can add logic to update the location in the parent component
      }
    }
  };

  const handleOfficialControlsError = (error) => {
    console.error('Official controls error:', error);
    // You can add error handling logic here
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      pending: { color: 'orange', icon: '⏳', text: 'Pending' },
      verified: { color: 'green', icon: '✅', text: 'Verified' },
      flagged: { color: 'red', icon: '🚩', text: 'Flagged' },
      removed: { color: 'gray', icon: '🗑️', text: 'Removed' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span 
        style={{
          backgroundColor: config.color,
          color: 'white',
          padding: '2px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          marginLeft: '8px'
        }}
        title={`Status: ${config.text}`}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  // Rating summary component
  const RatingSummary = ({ location }) => {
    const upvotes = location.upvotes || 0;
    const downvotes = location.downvotes || 0;
    const totalPoints = location.totalPoints || 0;
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        fontSize: '14px',
        marginTop: '4px'
      }}>
        <span title="Upvotes">👍 {upvotes}</span>
        <span title="Downvotes">👎 {downvotes}</span>
        <span title="Total Points" style={{ 
          fontWeight: 'bold',
          color: totalPoints >= 0 ? 'green' : 'red'
        }}>
          {totalPoints >= 0 ? '+' : ''}{totalPoints} pts
        </span>
        {location.locationStatus && (
          <StatusBadge status={location.locationStatus} />
        )}
      </div>
    );
  };

  return (
    <div
      key={location.id}
      style={{
        width: '275px',
        minHeight: '275px',
        maxHeight: '275px',
        padding: '15px',
        border: location.isOfficial ? '2px solid #2196F3' : '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: location.isOfficial ? '#f8fbff' : 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        boxShadow: location.isOfficial ? '0 4px 12px rgba(33, 150, 243, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
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
            marginBottom: '4px',
            fontWeight: location.isOfficial ? 'bold' : 'normal'
          }}>
            {location.content.text}
          </div>
          
          {/* Keywords Display */}
          <KeywordsDisplay keywords={location.keywords} maxDisplay={3} />
          
          {/* Ownership Status Indicators */}
          <div style={{
            marginTop: '8px',
            marginBottom: '8px'
          }}>
            <OwnershipStatus 
              location={location} 
              compact={compact}
              onStatusUpdate={() => {
                // Refresh ownership status if needed
              }}
            />
          </div>
          
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

          {/* Status Reason Display */}
          {location.statusReason && (
            <div style={{
              marginTop: '4px',
              fontSize: '11px',
              color: '#666',
              fontStyle: 'italic',
              padding: '2px 4px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              📝 {location.statusReason}
            </div>
          )}

          {/* Official Location Controls */}
          <OfficialLocationControls
            location={location}
            onSuccess={handleOfficialControlsSuccess}
            onError={handleOfficialControlsError}
            compact={compact}
          />

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

          {/* Location Trading Actions */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
            margin: '8px 0',
            flexWrap: 'wrap'
          }}>
            <BuyLocationButton
              location={location}
              onPurchaseSuccess={handlePurchaseSuccess}
              onError={handlePurchaseError}
              compact={compact}
            />
            
            {/* Purchase History Button */}
            <button
              onClick={() => setShowPurchaseHistory(true)}
              style={{
                padding: compact ? '4px 6px' : '6px 10px',
                backgroundColor: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: compact ? '10px' : '12px',
                cursor: 'pointer'
              }}
            >
              History
            </button>
          </div>

          {/* Official Location Info */}
          {location.isOfficial && (
            <div style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#E3F2FD',
              borderRadius: '6px',
              border: '1px solid #2196F3',
              fontSize: '11px',
              color: '#1976D2'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                ✓ Official Location
              </div>
              <div>
                Made official by: {location.officialOwner?.profile?.name || location.officialOwner?.email || 'Unknown'}
              </div>
              {location.officializedAt && (
                <div>
                  Date: {new Date(location.officializedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Remaining time for auto-delete locations */}
          {location.autoDelete && getRemainingTime() && (
            <div style={{
              marginTop: '8px',
              padding: '4px 8px',
              backgroundColor: '#FFF3E0',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#E65100'
            }}>
              ⏰ {getRemainingTime()}
            </div>
          )}

          {/* Action buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '12px'
          }}>
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={() => setShowShare(true)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#607D8B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '10px',
                  cursor: 'pointer'
                }}
              >
                Share
              </button>
              
              {/* Edit/Delete buttons for creator */}
              {currentUserId && creatorId && currentUserId === creatorId && (
                <>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(location)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(location.id)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShare && (
        <LocationShareModal
          location={location}
          locationLink={locationLink}
          onClose={() => setShowShare(false)}
        />
      )}

      {/* Purchase History Modal */}
      {showPurchaseHistory && (
        <PurchaseHistory
          locationId={location.id}
          onClose={() => setShowPurchaseHistory(false)}
        />
      )}
    </div>
  );
};

export default LocationCard;