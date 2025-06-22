import React, { useState } from 'react';
import '../styles/LocationForm.css';
import LOCATION_TYPES from '../constants/locationTypes';

const LocationForm = ({ position, onSubmit, submitting, onClose, user }) => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [autoDelete, setAutoDelete] = useState(false);
  const [deleteTime, setDeleteTime] = useState(0);
  const [deleteUnit, setDeleteUnit] = useState('minutes');
  const [creditAmount, setCreditAmount] = useState(0);
  const [locationType, setLocationType] = useState('general');

  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      lat: position.lat,
      lng: position.lng,
      text,
      media,
      isAnonymous,
      autoDelete,
      deleteTime,
      deleteUnit,
      creditAmount,
      locationType,
    });
  };

  return (
    <div className="location-form">
      <button onClick={handleCloseClick} className="close-button">&times;</button>
      <h3>Create a new location</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          placeholder="Add a description"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <input
          type="file"
          multiple
          onChange={(e) => setMedia([...e.target.files])}
        />
        
        {/* Location Type Selector */}
        <div className="form-group">
          <label htmlFor="locationType">Location Type:</label>
          <select
            id="locationType"
            value={locationType}
            onChange={(e) => setLocationType(e.target.value)}
            className="location-type-select"
          >
            {Object.entries(LOCATION_TYPES).map(([key, type]) => (
              <option key={key} value={key}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-options">
          <div className="checkbox-container">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="isAnonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <label htmlFor="isAnonymous">Post Anonymously</label>
            </div>
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="autoDelete"
                checked={autoDelete}
                onChange={(e) => setAutoDelete(e.target.checked)}
              />
              <label htmlFor="autoDelete">Set time to delete</label>
            </div>
          </div>
          {autoDelete && (
            <div className="auto-delete-options">
              <input
                type="number"
                min="0"
                value={deleteTime}
                onChange={(e) => setDeleteTime(parseInt(e.target.value, 10))}
              />
              <select
                value={deleteUnit}
                onChange={(e) => setDeleteUnit(e.target.value)}
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          )}
          <div className="credit-options">
            <label>
              Place Crypto (Avail: {user?.credits ?? 0})
            </label>
            <input
              type="number"
              min="0"
              value={creditAmount}
              onChange={(e) => setCreditAmount(parseInt(e.target.value, 10))}
            />
          </div>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Create Location'}
        </button>
      </form>
    </div>
  );
};

export default LocationForm; 