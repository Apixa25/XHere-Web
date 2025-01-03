const LocationCard = ({ location, onEdit, onDelete, compact = false }) => {
  // ... existing code ...

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

  return (
    <div className={compact ? "location-details" : "location-card"} style={{
      backgroundColor: 'white',
      padding: compact ? '10px' : '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      margin: compact ? '0' : '10px 0'
    }}>
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
          
          {/* ... rest of the existing code ... */}