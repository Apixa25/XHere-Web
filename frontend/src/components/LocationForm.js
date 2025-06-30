import React, { useState, useEffect } from 'react';
import '../styles/LocationForm.css';
import LOCATION_TYPES from '../constants/locationTypes';
import PlaceCreditsButton from './PlaceCreditsButton';

const LocationForm = ({ position, onSubmit, submitting, onClose, user, onLocationUpdate }) => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [autoDelete, setAutoDelete] = useState(false);
  const [deleteTime, setDeleteTime] = useState(0);
  const [deleteUnit, setDeleteUnit] = useState('minutes');
  const [locationType, setLocationType] = useState('general');
  const [keywords, setKeywords] = useState('');
  const [initialCredits, setInitialCredits] = useState(0);

  // Calculate required credits based on location type
  const getRequiredCredits = (type) => {
    return type === 'general' ? 0 : 100;
  };

  const requiredCredits = getRequiredCredits(locationType);
  const hasEnoughCredits = user?.credits >= requiredCredits;

  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if user has enough credits for non-general locations
    if (locationType !== 'general' && !hasEnoughCredits) {
      alert(`Insufficient credits. ${locationType} locations require 100 credits. You have ${user?.credits || 0} credits.`);
      return;
    }
    
    // Parse keywords from comma-separated string to array
    const keywordsArray = keywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    onSubmit({
      lat: position.lat,
      lng: position.lng,
      text,
      media,
      isAnonymous,
      autoDelete,
      deleteTime,
      deleteUnit,
      locationType,
      keywords: keywordsArray,
      initialCredits
    });
  };

  return (
    <div className="location-form">
      <button onClick={handleCloseClick} className="close-button">&times;</button>
      <h3>NEW LOCATION</h3>
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
        
        {/* Keywords Input */}
        <div className="form-group">
          <label htmlFor="keywords">Keywords/Tags:</label>
          <input
            type="text"
            id="keywords"
            placeholder="Enter keywords separated by commas (e.g., food, outdoor, family-friendly)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="keywords-input"
          />
          <small className="keywords-help">Add keywords to help others find your location</small>
        </div>
        
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
                {type.icon} {type.label} {key !== 'general' ? '(100 credits)' : '(Free)'}
              </option>
            ))}
          </select>
          
          {/* Credit requirement display */}
          <div className="credit-requirement">
            {locationType === 'general' ? (
              <div className="credit-info free">
                <span>✅ Free to post</span>
                <small>Auto-deleted in 7 days unless it gets 2+ positive ratings</small>
              </div>
            ) : (
              <div className={`credit-info ${hasEnoughCredits ? 'sufficient' : 'insufficient'}`}>
                <span>
                  {hasEnoughCredits ? '✅' : '❌'} {requiredCredits} credits required
                </span>
                <small>
                  Your balance: {user?.credits || 0} credits
                  {!hasEnoughCredits && ` (Need ${requiredCredits - (user?.credits || 0)} more)`}
                </small>
              </div>
            )}
          </div>
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
        </div>
        
        <button 
          type="submit" 
          disabled={submitting || (locationType !== 'general' && !hasEnoughCredits)}
          className={locationType !== 'general' && !hasEnoughCredits ? 'disabled' : ''}
        >
          {submitting ? 'Submitting...' : 
           locationType !== 'general' && !hasEnoughCredits ? 
           `Need ${requiredCredits - (user?.credits || 0)} more credits` : 
           'Create Location'}
        </button>
      </form>

      {/* Place Credits Button - always visible at the bottom, outside the form */}
      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <PlaceCreditsButton 
          user={user} 
          location={{ id: 'new', content: { text }, isNew: true }} 
          compact={false} 
          onLocationUpdate={onLocationUpdate}
          onCreditsPlaced={(amount) => setInitialCredits(amount)}
        />
      </div>
    </div>
  );
};

export default LocationForm; 