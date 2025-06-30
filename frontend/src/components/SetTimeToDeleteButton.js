import React, { useState } from 'react';
import api from '../services/api';

const SetTimeToDeleteButton = ({ location, user, onSuccess, compact = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteTime, setDeleteTime] = useState(60);
  const [deleteUnit, setDeleteUnit] = useState('minutes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSetDeleteTime = async () => {
    if (!user || !location) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert to milliseconds based on unit
      let timeInMs;
      switch (deleteUnit) {
        case 'minutes':
          timeInMs = deleteTime * 60 * 1000;
          break;
        case 'hours':
          timeInMs = deleteTime * 60 * 60 * 1000;
          break;
        case 'days':
          timeInMs = deleteTime * 24 * 60 * 60 * 1000;
          break;
        default:
          timeInMs = deleteTime * 60 * 1000;
      }

      const deleteAt = new Date(Date.now() + timeInMs);

      const response = await api.put(`/locations/${location.id}/delete-time`, {
        deleteAt: deleteAt.toISOString(),
        autoDelete: true
      });
      
      if (response.data.success) {
        setShowModal(false);
        if (onSuccess) {
          onSuccess(response.data);
        }
        alert(`✅ Location will be deleted in ${deleteTime} ${deleteUnit}!`);
      }
    } catch (err) {
      console.error('Error setting delete time:', err);
      setError(err.response?.data?.message || 'Failed to set delete time');
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: compact ? '8px 12px' : '10px 16px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontSize: compact ? '12px' : '14px',
      fontWeight: 'bold',
      transition: 'all 0.2s ease',
      textDecoration: 'none',
      justifyContent: 'center',
      minWidth: compact ? 'auto' : '120px',
      backgroundColor: '#FF5722',
      color: 'white'
    };

    if (loading) {
      return {
        ...baseStyle,
        backgroundColor: '#f5f5f5',
        color: '#666',
        cursor: 'not-allowed'
      };
    }

    return baseStyle;
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={loading || !user}
        style={getButtonStyle()}
        onMouseOver={(e) => {
          if (!loading && user) {
            e.target.style.backgroundColor = '#E64A19';
          }
        }}
        onMouseOut={(e) => {
          if (!loading && user) {
            e.target.style.backgroundColor = '#FF5722';
          }
        }}
        title="Set time to delete this location"
      >
        <span>⏰</span>
        <span>{compact ? 'Delete' : 'Set Delete Time'}</span>
      </button>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90vw',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              ⏰ Set Time to Delete
            </h3>
            
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Set when this location should be automatically deleted. 
              This action cannot be undone!
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Time until deletion:
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  value={deleteTime}
                  onChange={(e) => setDeleteTime(parseInt(e.target.value) || 1)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
                <select
                  value={deleteUnit}
                  onChange={(e) => setDeleteUnit(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            {error && (
              <div style={{
                padding: '8px 12px',
                backgroundColor: '#ffebee',
                color: '#c62828',
                borderRadius: '6px',
                marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSetDeleteTime}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: loading ? '#ccc' : '#FF5722',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Setting...' : `Delete in ${deleteTime} ${deleteUnit}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SetTimeToDeleteButton; 