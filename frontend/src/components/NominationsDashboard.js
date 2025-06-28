import React, { useState, useEffect } from 'react';
import api from '../services/api';
import NominationStatus from './NominationStatus';
import NominationVoteButton from './NominationVoteButton';
import CreatorResponseButton from './CreatorResponseButton';
import './NominationsDashboard.css';

const NominationsDashboard = () => {
  const [nominations, setNominations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Get current user info safely
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  })();

  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (currentUserId) {
      loadNominations();
    }
  }, [currentUserId]);

  const loadNominations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getNominations();
      if (response.success) {
        setNominations(response.nominations || []);
      } else {
        setError(response.message || 'Failed to load nominations');
      }
    } catch (error) {
      console.error('Error loading nominations:', error);
      setError(error.message || 'Failed to load nominations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoteSuccess = (updatedNomination) => {
    setNominations(prev => 
      prev.map(nom => nom.id === updatedNomination.id ? updatedNomination : nom)
    );
  };

  const handleResponseSuccess = (updatedNomination) => {
    setNominations(prev => 
      prev.map(nom => nom.id === updatedNomination.id ? updatedNomination : nom)
    );
  };

  const filterNominations = () => {
    switch (activeTab) {
      case 'my-nominations':
        return nominations.filter(nom => nom.nominatorId === currentUserId);
      case 'pending':
        return nominations.filter(nom => 
          nom.status === 'pending' && new Date(nom.expiresAt) > new Date()
        );
      case 'approved':
        return nominations.filter(nom => nom.status === 'approved');
      case 'completed':
        return nominations.filter(nom => 
          ['accepted', 'rejected', 'failed'].includes(nom.status)
        );
      default:
        return nominations;
    }
  };

  const getTabCount = (tab) => {
    switch (tab) {
      case 'my-nominations':
        return nominations.filter(nom => nom.nominatorId === currentUserId).length;
      case 'pending':
        return nominations.filter(nom => 
          nom.status === 'pending' && new Date(nom.expiresAt) > new Date()
        ).length;
      case 'approved':
        return nominations.filter(nom => nom.status === 'approved').length;
      case 'completed':
        return nominations.filter(nom => 
          ['accepted', 'rejected', 'failed'].includes(nom.status)
        ).length;
      default:
        return nominations.length;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (isLoading) {
    return (
      <div className="nominations-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading nominations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nominations-dashboard">
        <div className="dashboard-error">
          <h3>❌ Error Loading Nominations</h3>
          <p>{error}</p>
          <button onClick={loadNominations} className="retry-button">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredNominations = filterNominations();

  return (
    <div className="nominations-dashboard">
      <div className="dashboard-header">
        <h2>🏆 Nominations Dashboard</h2>
        <p>Track and manage location nominations for official status</p>
      </div>

      <div className="dashboard-tabs">
        <button
          onClick={() => setActiveTab('all')}
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
        >
          All ({getTabCount('all')})
        </button>
        <button
          onClick={() => setActiveTab('my-nominations')}
          className={`tab-button ${activeTab === 'my-nominations' ? 'active' : ''}`}
        >
          My Nominations ({getTabCount('my-nominations')})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
        >
          Pending ({getTabCount('pending')})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`tab-button ${activeTab === 'approved' ? 'active' : ''}`}
        >
          Approved ({getTabCount('approved')})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
        >
          Completed ({getTabCount('completed')})
        </button>
      </div>

      <div className="nominations-list">
        {filteredNominations.length === 0 ? (
          <div className="empty-state">
            <h3>No nominations found</h3>
            <p>
              {activeTab === 'all' && 'No nominations have been created yet.'}
              {activeTab === 'my-nominations' && 'You haven\'t created any nominations yet.'}
              {activeTab === 'pending' && 'No pending nominations at the moment.'}
              {activeTab === 'approved' && 'No approved nominations waiting for response.'}
              {activeTab === 'completed' && 'No completed nominations found.'}
            </p>
          </div>
        ) : (
          filteredNominations.map(nomination => (
            <div key={nomination.id} className="nomination-card">
              <div className="nomination-header">
                <div className="nomination-location">
                  <h4>{nomination.location?.content?.text || 'Unknown Location'}</h4>
                  <p>Created by: {nomination.location?.creator?.name || nomination.location?.creator?.email || 'Unknown'}</p>
                </div>
                <NominationStatus nomination={nomination} />
              </div>

              <div className="nomination-details">
                <div className="nomination-info">
                  <p><strong>Nominated by:</strong> {nomination.nominator?.name || nomination.nominator?.email || 'Unknown'}</p>
                  <p><strong>Reason:</strong> "{nomination.reason}"</p>
                  <p><strong>Created:</strong> {formatDate(nomination.createdAt)}</p>
                  {nomination.status === 'pending' && (
                    <p><strong>Expires:</strong> {formatDate(nomination.expiresAt)} ({getTimeRemaining(nomination.expiresAt)})</p>
                  )}
                  {nomination.status === 'approved' && (
                    <p><strong>Approved:</strong> {formatDate(nomination.updatedAt)}</p>
                  )}
                  {['accepted', 'rejected', 'failed'].includes(nomination.status) && (
                    <p><strong>Completed:</strong> {formatDate(nomination.updatedAt)}</p>
                  )}
                </div>

                <div className="nomination-actions">
                  {/* Show voting for pending nominations */}
                  {nomination.status === 'pending' && new Date(nomination.expiresAt) > new Date() && (
                    <NominationVoteButton
                      nomination={nomination}
                      onVoteSuccess={handleVoteSuccess}
                      onVoteError={setError}
                    />
                  )}

                  {/* Show creator response for approved nominations */}
                  {nomination.status === 'approved' && currentUserId === nomination.location?.creatorId && (
                    <CreatorResponseButton
                      nomination={nomination}
                      onResponseSuccess={handleResponseSuccess}
                      onResponseError={setError}
                    />
                  )}

                  {/* Show vote count for pending nominations */}
                  {nomination.status === 'pending' && (
                    <div className="vote-progress">
                      <div className="vote-bar">
                        <div 
                          className="vote-fill" 
                          style={{ width: `${(nomination.currentVotes / nomination.votesRequired) * 100}%` }}
                        ></div>
                      </div>
                      <span>{nomination.currentVotes}/{nomination.votesRequired} votes</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

 