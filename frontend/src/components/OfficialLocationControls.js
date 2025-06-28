import React, { useState, useEffect } from 'react';
import MakeOfficialButton from './MakeOfficialButton';
import NominationButton from './NominationButton';
import NominationVoteButton from './NominationVoteButton';
import CreatorResponseButton from './CreatorResponseButton';
import NominationStatus from './NominationStatus';
import api from '../services/api';
import './OfficialLocationControls.css';

const OfficialLocationControls = ({ location, onSuccess, onError, compact = false }) => {
  const [nominations, setNominations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current user info safely
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  const currentUserId = currentUser?.id;
  const isAdmin = currentUser?.isAdmin;
  const creatorId = location.creator?.id || location.creatorId;
  const isCreator = currentUserId === creatorId;

  useEffect(() => {
    if (location && !location.isOfficial && nominations.length === 0 && !isLoading) {
      loadNominations();
    }
  }, [location?.id, location?.isOfficial]);

  const loadNominations = async () => {
    console.log('🔍 Loading nominations for location:', location.id);
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getLocationNominations(location.id);
      console.log('🔍 Nominations API response:', response);
      
      if (response.success) {
        setNominations(response.nominations || []);
        console.log('🔍 Set nominations:', response.nominations || []);
      } else {
        setError(response.message || 'Failed to load nominations');
        console.error('🔍 Failed to load nominations:', response.message);
      }
    } catch (error) {
      console.error('🔍 Error loading nominations:', error);
      setError(error.message || 'Failed to load nominations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNominationSuccess = (newNomination) => {
    setNominations(prev => [newNomination, ...prev]);
    if (onSuccess) {
      onSuccess({ type: 'nomination_created', nomination: newNomination });
    }
  };

  const handleVoteSuccess = (updatedNomination) => {
    setNominations(prev => 
      prev.map(nom => nom.id === updatedNomination.id ? updatedNomination : nom)
    );
    if (onSuccess) {
      onSuccess({ type: 'nomination_voted', nomination: updatedNomination });
    }
  };

  const handleResponseSuccess = (updatedNomination) => {
    setNominations(prev => 
      prev.map(nom => nom.id === updatedNomination.id ? updatedNomination : nom)
    );
    if (onSuccess) {
      onSuccess({ type: 'nomination_responded', nomination: updatedNomination });
    }
  };

  const handleMakeOfficialSuccess = (updatedLocation) => {
    if (onSuccess) {
      onSuccess({ type: 'location_made_official', location: updatedLocation });
    }
  };

  // Don't show anything if location is already official
  if (location.isOfficial) {
    return (
      <div className="official-badge">
        <span>✅ Official</span>
      </div>
    );
  }

  // Get the most recent active nomination
  const activeNomination = nominations.find(nom => 
    ['pending', 'approved'].includes(nom.status) && 
    new Date(nom.expiresAt) > new Date()
  );

  // Get the most recent completed nomination
  const completedNomination = nominations.find(nom => 
    ['accepted', 'rejected', 'failed'].includes(nom.status)
  );

  return (
    <div className="official-location-controls">
      {error && (
        <div className="controls-error">
          ❌ {error}
        </div>
      )}

      {/* Show nomination status if there's an active or completed nomination */}
      {activeNomination && (
        <NominationStatus nomination={activeNomination} compact={compact} />
      )}
      
      {!activeNomination && completedNomination && (
        <NominationStatus nomination={completedNomination} compact={compact} />
      )}

      {/* Show voting interface for active nominations */}
      {activeNomination && activeNomination.status === 'pending' && (
        <NominationVoteButton
          nomination={activeNomination}
          onVoteSuccess={handleVoteSuccess}
          onVoteError={setError}
        />
      )}

      {/* Show creator response for approved nominations */}
      {activeNomination && activeNomination.status === 'approved' && (
        <CreatorResponseButton
          nomination={activeNomination}
          onResponseSuccess={handleResponseSuccess}
          onResponseError={setError}
        />
      )}

      {/* Show nomination button for non-creators when no active nomination */}
      {!activeNomination && !isCreator && (
        <NominationButton
          location={location}
          onSuccess={handleNominationSuccess}
          onError={setError}
          compact={compact}
        />
      )}

      {/* Show make official button for creators and admins */}
      {(isCreator || isAdmin) && (
        <MakeOfficialButton
          location={location}
          onSuccess={handleMakeOfficialSuccess}
          onError={setError}
          compact={compact}
        />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="controls-loading">
          Loading...
        </div>
      )}
    </div>
  );
};

export default OfficialLocationControls; 