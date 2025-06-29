import React, { useState } from 'react';
import OfficialLocationControls from './OfficialLocationControls';
import NominationButton from './NominationButton';
import NominationVoteButton from './NominationVoteButton';
import CreatorResponseButton from './CreatorResponseButton';
import NominationStatus from './NominationStatus';
import NominationsDashboard from './NominationsDashboard';
import './NominationDemo.css';

const NominationDemo = () => {
  const [activeTab, setActiveTab] = useState('controls');

  // Mock location data for demonstration
  const mockLocation = {
    id: 1,
    content: { text: 'Demo Coffee Shop' },
    creator: { id: 2, name: 'John Doe', email: 'john@example.com' },
    isOfficial: false,
    keywords: ['coffee', 'cafe', 'breakfast']
  };

  // Mock nomination data for demonstration
  const mockNomination = {
    id: 1,
    locationId: 1,
    nominatorId: 3,
    nominator: { id: 3, name: 'Jane Smith', email: 'jane@example.com' },
    location: mockLocation,
    reason: 'This is a great local coffee shop that deserves official status for its quality and community presence.',
    status: 'pending',
    currentVotes: 2,
    votesRequired: 3,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    votes: []
  };

  const mockApprovedNomination = {
    ...mockNomination,
    id: 2,
    status: 'approved',
    currentVotes: 3,
    votesRequired: 3
  };

  const mockCompletedNomination = {
    ...mockNomination,
    id: 3,
    status: 'accepted',
    currentVotes: 3,
    votesRequired: 3
  };

  return (
    <div className="nomination-demo">
      <div className="demo-header">
        <h1>🏆 Nomination System Demo</h1>
        <p>Test and explore the hybrid "Make Official" ecosystem</p>
      </div>

      <div className="demo-tabs">
        <button
          onClick={() => setActiveTab('controls')}
          className={`demo-tab ${activeTab === 'controls' ? 'active' : ''}`}
        >
          Location Controls
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={`demo-tab ${activeTab === 'components' ? 'active' : ''}`}
        >
          Individual Components
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`demo-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          Nominations Dashboard
        </button>
      </div>

      <div className="demo-content">
        {activeTab === 'controls' && (
          <div className="demo-section">
            <h2>📍 Location Card with Official Controls</h2>
            <p>This shows how the OfficialLocationControls component integrates into a location card:</p>
            
            <div className="demo-location-card">
              <div className="location-header">
                <h3>{mockLocation.content.text}</h3>
                <div className="location-meta">
                  <span>Created by: {mockLocation.creator.name}</span>
                  <span>Keywords: {mockLocation.keywords.join(', ')}</span>
                </div>
              </div>
              
              <OfficialLocationControls
                location={mockLocation}
                onSuccess={(result) => console.log('Success:', result)}
                onError={(error) => console.error('Error:', error)}
              />
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="demo-section">
            <h2>🧩 Individual Components</h2>
            
            <div className="component-grid">
              <div className="component-demo">
                <h3>Nomination Button</h3>
                <p>For non-creators to nominate locations:</p>
                <NominationButton
                  location={mockLocation}
                  onSuccess={(nomination) => console.log('Nomination created:', nomination)}
                  onError={(error) => console.error('Nomination error:', error)}
                />
              </div>

              <div className="component-demo">
                <h3>Vote Button</h3>
                <p>For community voting on nominations:</p>
                <NominationVoteButton
                  nomination={mockNomination}
                  onVoteSuccess={(nomination) => console.log('Vote successful:', nomination)}
                  onVoteError={(error) => console.error('Vote error:', error)}
                />
              </div>

              <div className="component-demo">
                <h3>Creator Response</h3>
                <p>For creators to respond to approved nominations:</p>
                <CreatorResponseButton
                  nomination={mockApprovedNomination}
                  onResponseSuccess={(nomination) => console.log('Response successful:', nomination)}
                  onResponseError={(error) => console.error('Response error:', error)}
                />
              </div>

              <div className="component-demo">
                <h3>Status Display</h3>
                <p>Shows nomination status:</p>
                <div className="status-examples">
                  <div>
                    <strong>Pending:</strong>
                    <NominationStatus nomination={mockNomination} />
                  </div>
                  <div>
                    <strong>Approved:</strong>
                    <NominationStatus nomination={mockApprovedNomination} />
                  </div>
                  <div>
                    <strong>Completed:</strong>
                    <NominationStatus nomination={mockCompletedNomination} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="demo-section">
            <h2>📊 Nominations Dashboard</h2>
            <p>Complete dashboard for managing nominations:</p>
            <NominationsDashboard />
          </div>
        )}
      </div>

      <div className="demo-info">
        <h3>ℹ️ How the System Works</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>👤 Creator Path</h4>
            <ul>
              <li>Cost: 300 credits</li>
              <li>Speed: Immediate</li>
              <li>Use: Make your own location official</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h4>🏆 Community Path</h4>
            <ul>
              <li>Cost: 5 credits</li>
              <li>Voting: 3+ community votes required</li>
              <li>Duration: 7 days</li>
              <li>Creator must accept/reject if approved</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h4>👑 Admin Path</h4>
            <ul>
              <li>Cost: No credits</li>
              <li>Speed: Immediate</li>
              <li>Use: Admin override for verified locations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NominationDemo; 