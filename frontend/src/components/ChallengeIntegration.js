import React from 'react';
import ChallengeDashboard from './ChallengeDashboard';

// This is an example of how to integrate the ChallengeDashboard into your main App.js
const ChallengeIntegration = ({ user, API_URL }) => {
  return (
    <div className="challenge-integration">
      <h2>🎯 Community Challenges Integration</h2>
      <p>This component shows how to integrate the ChallengeDashboard into your main app.</p>
      
      {/* The ChallengeDashboard component */}
      <ChallengeDashboard user={user} API_URL={API_URL} />
    </div>
  );
};

export default ChallengeIntegration;

/*
INTEGRATION GUIDE:

1. Import the ChallengeDashboard in your App.js:
   import ChallengeDashboard from './components/ChallengeDashboard';

2. Add a route or navigation item for challenges:
   <Route path="/challenges" element={<ChallengeDashboard user={user} API_URL={API_URL} />} />

3. Add a navigation link:
   <Link to="/challenges">🎯 Challenges</Link>

4. The ChallengeDashboard will handle:
   - Fetching active challenges
   - Displaying challenge details
   - Submitting locations
   - Voting on submissions
   - Showing leaderboards

5. API Endpoints used:
   - GET /api/challenges - Get all active challenges
   - GET /api/challenges/:id - Get challenge details
   - POST /api/challenges/:id/submit - Submit location
   - POST /api/challenges/submissions/:id/vote - Vote on submission
   - GET /api/challenges/:id/leaderboard - Get leaderboard

6. Features included:
   - Beautiful, responsive UI
   - Real-time updates
   - Community voting system
   - Reward tracking
   - Mobile-friendly design

7. Styling:
   - Uses ChallengeDashboard.css
   - Modern gradient design
   - Smooth animations
   - Responsive layout

8. Testing:
   - Test with sample challenges
   - Verify API endpoints
   - Check mobile responsiveness
   - Test voting functionality
*/ 