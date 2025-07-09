import React, { useState, useEffect } from 'react';
import reportAppealService from '../services/reportAppealService';
import './AdminPanel.css';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    activeModerators: 0,
    systemHealth: 'good'
  });
  const [moderators, setModerators] = useState([]);
  const [systemSettings, setSystemSettings] = useState({
    autoModeration: true,
    requireEvidence: true,
    maxReportsPerUser: 5,
    reportCooldown: 24,
    moderatorApprovalRequired: false
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load admin statistics
      const adminStats = await reportAppealService.getAdminStats();
      setStats(adminStats);
      
      // Load moderators list
      const moderatorsData = await reportAppealService.getModerators();
      setModerators(moderatorsData);
      
    } catch (err) {
      setError('Failed to load admin data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (setting, value) => {
    try {
      setSystemSettings(prev => ({ ...prev, [setting]: value }));
      
      // Save setting to backend
      await reportAppealService.updateSystemSetting(setting, value);
    } catch (err) {
      setError('Failed to update setting: ' + err.message);
    }
  };

  const handleAddModerator = async (userId) => {
    try {
      await reportAppealService.addModerator(userId);
      loadAdminData(); // Refresh moderators list
    } catch (err) {
      setError('Failed to add moderator: ' + err.message);
    }
  };

  const handleRemoveModerator = async (userId) => {
    try {
      await reportAppealService.removeModerator(userId);
      loadAdminData(); // Refresh moderators list
    } catch (err) {
      setError('Failed to remove moderator: ' + err.message);
    }
  };

  const renderOverview = () => (
    <div className="overview-section">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Reports</h3>
            <div className="stat-value">{stats.totalReports}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Reports</h3>
            <div className="stat-value">{stats.pendingReports}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Resolved Reports</h3>
            <div className="stat-value">{stats.resolvedReports}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛡️</div>
          <div className="stat-content">
            <h3>Active Moderators</h3>
            <div className="stat-value">{stats.activeModerators}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💚</div>
          <div className="stat-content">
            <h3>System Health</h3>
            <div className="stat-value">{stats.systemHealth}</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>🚀 Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn">
            📋 View All Reports
          </button>
          <button className="action-btn">
            👥 Manage Moderators
          </button>
          <button className="action-btn">
            ⚙️ System Settings
          </button>
          <button className="action-btn">
            📊 View Analytics
          </button>
        </div>
      </div>
    </div>
  );

  const renderModerators = () => (
    <div className="moderators-section">
      <div className="section-header">
        <h3>🛡️ Moderator Management</h3>
        <button className="add-moderator-btn">
          ➕ Add Moderator
        </button>
      </div>

      <div className="moderators-list">
        {moderators.length === 0 ? (
          <div className="empty-state">
            <p>No moderators found</p>
          </div>
        ) : (
          moderators.map(moderator => (
            <div key={moderator.id} className="moderator-card">
              <div className="moderator-info">
                <div className="moderator-avatar">
                  {moderator.profile?.picture ? (
                    <img src={moderator.profile.picture} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">👤</div>
                  )}
                </div>
                <div className="moderator-details">
                  <h4>{moderator.profile?.name || moderator.email}</h4>
                  <p>{moderator.email}</p>
                  <span className="moderator-status">
                    {moderator.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
              </div>
              <div className="moderator-stats">
                <div className="stat">
                  <span className="stat-label">Reports Handled:</span>
                  <span className="stat-value">{moderator.reportsHandled || 0}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Last Active:</span>
                  <span className="stat-value">
                    {moderator.lastActive ? new Date(moderator.lastActive).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
              <div className="moderator-actions">
                <button 
                  className="remove-moderator-btn"
                  onClick={() => handleRemoveModerator(moderator.id)}
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-section">
      <h3>⚙️ System Settings</h3>
      
      <div className="settings-grid">
        <div className="setting-item">
          <div className="setting-info">
            <h4>Auto Moderation</h4>
            <p>Automatically flag suspicious content for review</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={systemSettings.autoModeration}
                onChange={(e) => handleSettingChange('autoModeration', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h4>Require Evidence</h4>
            <p>Require evidence for all report submissions</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={systemSettings.requireEvidence}
                onChange={(e) => handleSettingChange('requireEvidence', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h4>Max Reports Per User</h4>
            <p>Maximum number of reports a user can submit per day</p>
          </div>
          <div className="setting-control">
            <input 
              type="number" 
              value={systemSettings.maxReportsPerUser}
              onChange={(e) => handleSettingChange('maxReportsPerUser', parseInt(e.target.value))}
              min="1"
              max="20"
            />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h4>Report Cooldown (hours)</h4>
            <p>Time between reports from the same user</p>
          </div>
          <div className="setting-control">
            <input 
              type="number" 
              value={systemSettings.reportCooldown}
              onChange={(e) => handleSettingChange('reportCooldown', parseInt(e.target.value))}
              min="1"
              max="168"
            />
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h4>Moderator Approval Required</h4>
            <p>Require moderator approval for all actions</p>
          </div>
          <div className="setting-control">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={systemSettings.moderatorApprovalRequired}
                onChange={(e) => handleSettingChange('moderatorApprovalRequired', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-section">
      <h3>📊 Analytics & Insights</h3>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>📈 Report Trends</h4>
          <div className="chart-placeholder">
            <p>Chart showing report volume over time</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>🎯 Report Types</h4>
          <div className="chart-placeholder">
            <p>Pie chart of report categories</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>⏱️ Resolution Times</h4>
          <div className="chart-placeholder">
            <p>Average time to resolve reports</p>
          </div>
        </div>
        
        <div className="analytics-card">
          <h4>👥 Moderator Performance</h4>
          <div className="chart-placeholder">
            <p>Reports handled per moderator</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="panel-header">
          <div className="header-top">
            <h1>⚙️ Admin Panel</h1>
            <button 
              onClick={() => window.history.back()} 
              className="back-to-map-button"
            >
              ← Back to Map
            </button>
          </div>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-panel">
        <div className="panel-header">
          <div className="header-top">
            <h1>⚙️ Admin Panel</h1>
            <button 
              onClick={() => window.history.back()} 
              className="back-to-map-button"
            >
              ← Back to Map
            </button>
          </div>
          <div className="error-message">
            <h3>❌ Error Loading Admin Data</h3>
            <p>{error}</p>
            <button onClick={loadAdminData} className="retry-button">
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <div className="header-top">
          <h1>⚙️ Admin Panel</h1>
          <button 
            onClick={() => window.history.back()} 
            className="back-to-map-button"
          >
            ← Back to Map
          </button>
        </div>
        <p>Manage the moderation system and community</p>
      </div>

      {/* Navigation Tabs */}
      <div className="panel-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'moderators' ? 'active' : ''}`}
          onClick={() => setActiveTab('moderators')}
        >
          🛡️ Moderators
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📈 Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="panel-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'moderators' && renderModerators()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
};

export default AdminPanel; 