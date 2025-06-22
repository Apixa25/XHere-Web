import React, { useState } from 'react';
import '../styles/LocationForm.css';

const LocationForm = ({ position, onSubmit, submitting }) => {
  const [text, setText] = useState('');
  const [media, setMedia] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [autoDelete, setAutoDelete] = useState(false);
  const [deleteTime, setDeleteTime] = useState(0);
  const [deleteUnit, setDeleteUnit] = useState('minutes');
  const [creditAmount, setCreditAmount] = useState(0);

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
    });
  };

  return (
    <div className="location-form">
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
        <div className="form-options">
          <label>
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
            />
            Post Anonymously
          </label>
          <label>
            <input
              type="checkbox"
              checked={autoDelete}
              onChange={(e) => setAutoDelete(e.target.checked)}
            />
            Set time to delete
          </label>
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
            <label>Credit Amount (Crypto)</label>
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