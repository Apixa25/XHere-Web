import React, { useState } from 'react';

const LocationForm = () => {
  const [assignCredits, setAssignCredits] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);

  return (
    <div>
      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={assignCredits}
            onChange={(e) => setAssignCredits(e.target.checked)}
          />
          Assign XHere credits to this location
        </label>
        
        {assignCredits && (
          <div className="credits-input">
            <label>How many credits?</label>
            <input
              type="number"
              min="0"
              max={user.credits || 0}
              value={creditAmount}
              onChange={(e) => setCreditAmount(parseInt(e.target.value))}
            />
            <small className="text-muted">
              Available credits: {user.credits || 0}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationForm; 