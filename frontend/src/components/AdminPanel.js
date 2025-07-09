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
  const [reports, setReports] = useState([]);
  const [reportFilters, setReportFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    timeRange: '7d'
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // New state for user management
  const [showUserModal, setShowUserModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('moderator'); // 'moderator' or 'admin'
  const [userModalLoading, setUserModalLoading] = useState(false);

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
      
      // Load reports
      await loadReports();
      
    } catch (err) {
      setError('Failed to load admin data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      const reportsData = await reportAppealService.getReportsForReview(reportFilters);
      setReports(reportsData.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
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

  // New functions for user management
  const loadUsers = async () => {
    try {
      setUserModalLoading(true);
      const response = await fetch('http://localhost:3000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError('Failed to load users: ' + err.message);
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleOpenUserModal = (role = 'moderator') => {
    setSelectedRole(role);
    setShowUserModal(true);
    loadUsers();
  };

  const handlePromoteUser = async (userId, role) => {
    try {
      setUserModalLoading(true);
      
      if (role === 'admin') {
        // Promote to admin
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/promote`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'admin' })
        });
        
        if (!response.ok) {
          throw new Error('Failed to promote user to admin');
        }
      } else {
        // Promote to moderator
        await reportAppealService.addModerator(userId);
      }
      
      // Refresh data
      await loadAdminData();
      await loadUsers();
      
      alert(`User successfully promoted to ${role}!`);
    } catch (err) {
      setError(`Failed to promote user to ${role}: ` + err.message);
    } finally {
      setUserModalLoading(false);
    }
  };

  const handleDemoteUser = async (userId, currentRole) => {
    try {
      setUserModalLoading(true);
      
      if (currentRole === 'admin') {
        // Demote from admin
        const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/demote`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ role: 'admin' })
        });
        
        if (!response.ok) {
          throw new Error('Failed to demote admin');
        }
      } else {
        // Demote from moderator
        await reportAppealService.removeModerator(userId);
      }
      
      // Refresh data
      await loadAdminData();
      await loadUsers();
      
      alert(`User successfully demoted from ${currentRole}!`);
    } catch (err) {
      setError(`Failed to demote user from ${currentRole}: ` + err.message);
    } finally {
      setUserModalLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = userSearchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.profile?.name && user.profile.name.toLowerCase().includes(searchLower))
    );
  });

  const handleFilterChange = async (filterType, value) => {
    const newFilters = { ...reportFilters, [filterType]: value };
    setReportFilters(newFilters);
    await loadReports();
  };

  const handleViewReport = async (reportId) => {
    try {
      const reportDetails = await reportAppealService.getReportDetails(reportId);
      setSelectedReport(reportDetails);
      setShowReportModal(true);
    } catch (err) {
      setError('Failed to load report details: ' + err.message);
    }
  };

  const handleResolveReport = async (reportId, resolution) => {
    try {
      await reportAppealService.resolveReport(reportId, resolution, 'current-user-id');
      setShowReportModal(false);
      setSelectedReport(null);
      await loadReports();
      await loadAdminData(); // Refresh stats
    } catch (err) {
      setError('Failed to resolve report: ' + err.message);
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
          <button 
            className="action-btn"
            onClick={() => setActiveTab('reports')}
          >
            📋 View All Reports
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('moderators')}
          >
            👥 Manage Moderators
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ System Settings
          </button>
          <button 
            className="action-btn"
            onClick={() => setActiveTab('analytics')}
          >
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
        <div className="header-actions">
          <button 
            className="add-moderator-btn"
            onClick={() => handleOpenUserModal('moderator')}
          >
            ➕ Add Moderator
          </button>
          <button 
            className="add-admin-btn"
            onClick={() => handleOpenUserModal('admin')}
            style={{
              background: 'linear-gradient(45deg, #9b59b6, #8e44ad)',
              marginLeft: '10px'
            }}
          >
            👑 Add Admin
          </button>
        </div>
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

  const renderReports = () => (
    <div className="reports-section">
      <div className="section-header">
        <h3>📋 Reports Management</h3>
        <div className="report-filters">
          <select 
            value={reportFilters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          
          <select 
            value={reportFilters.type} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="spam">Spam</option>
            <option value="inappropriate">Inappropriate</option>
            <option value="duplicate">Duplicate</option>
            <option value="fake">Fake</option>
            <option value="offensive">Offensive</option>
            <option value="other">Other</option>
          </select>
          
          <select 
            value={reportFilters.priority} 
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="reports-list">
        {reports.length === 0 ? (
          <div className="empty-state">
            <p>No reports found matching your filters</p>
          </div>
        ) : (
          reports.map(report => (
            <div key={report.id} className="report-card">
              <div className="report-header">
                <div className="report-type">
                  <span className={`type-badge ${report.reportType}`}>
                    {report.reportType}
                  </span>
                  <span className={`priority-badge ${report.priority}`}>
                    {report.priority}
                  </span>
                </div>
                <div className="report-status">
                  <span className={`status-badge ${report.status}`}>
                    {report.status}
                  </span>
                </div>
              </div>
              
              <div className="report-content">
                <h4>Location: {report.location?.name || 'Unknown Location'}</h4>
                <p className="report-reason">{report.reason}</p>
                <div className="report-meta">
                  <span>Reported by: {report.reporter?.profile?.name || report.reporter?.email || 'Anonymous'}</span>
                  <span>Date: {new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="report-actions">
                <button 
                  className="view-report-btn"
                  onClick={() => handleViewReport(report.id)}
                >
                  👁️ View Details
                </button>
                {report.status === 'pending' && (
                  <button 
                    className="resolve-report-btn"
                    onClick={() => handleViewReport(report.id)}
                  >
                    ⚖️ Resolve
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <div className="modal-overlay">
          <div className="report-modal">
            <div className="modal-header">
              <h3>📋 Report Details</h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="modal-close-btn"
                title="Close modal"
              >
                ✕ Close
              </button>
            </div>
            
            <div className="modal-content">
              <div className="report-details">
                <div className="detail-section">
                  <h4>📍 Location Information</h4>
                  <p><strong>Name:</strong> {selectedReport.location?.name}</p>
                  <p><strong>Type:</strong> {selectedReport.location?.type}</p>
                  <p><strong>Created by:</strong> {selectedReport.location?.creator?.profile?.name || selectedReport.location?.creator?.email}</p>
                </div>
                
                <div className="detail-section">
                  <h4>🚨 Report Information</h4>
                  <p><strong>Type:</strong> {selectedReport.reportType}</p>
                  <p><strong>Priority:</strong> {selectedReport.priority}</p>
                  <p><strong>Reason:</strong> {selectedReport.reason}</p>
                  <p><strong>Reporter:</strong> {selectedReport.reporter?.profile?.name || selectedReport.reporter?.email || 'Anonymous'}</p>
                  <p><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                </div>
                
                {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                  <div className="detail-section">
                    <h4>📎 Evidence</h4>
                    {selectedReport.evidence.map((evidence, index) => (
                      <div key={index} className="evidence-item">
                        <p><strong>Type:</strong> {evidence.type}</p>
                        <p><strong>Content:</strong> {evidence.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedReport.status === 'pending' && (
                <div className="resolution-form">
                  <h4>⚖️ Resolution</h4>
                  <div className="form-group">
                    <label>Action:</label>
                    <select id="resolution-action" className="form-control">
                      <option value="location_removed">Remove Location</option>
                      <option value="location_flagged">Flag Location</option>
                      <option value="warning_issued">Issue Warning</option>
                      <option value="no_action">No Action</option>
                      <option value="user_suspended">Suspend User</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Notes:</label>
                    <textarea 
                      id="resolution-notes" 
                      className="form-control"
                      placeholder="Enter resolution notes..."
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="form-actions">
                    <button 
                      className="resolve-btn"
                      onClick={() => {
                        const action = document.getElementById('resolution-action').value;
                        const notes = document.getElementById('resolution-notes').value;
                        handleResolveReport(selectedReport.id, {
                          status: 'resolved',
                          action: action,
                          notes: notes
                        });
                      }}
                    >
                      ✅ Resolve Report
                    </button>
                    <button 
                      className="dismiss-btn"
                      onClick={() => {
                        const notes = document.getElementById('resolution-notes').value;
                        handleResolveReport(selectedReport.id, {
                          status: 'dismissed',
                          action: 'no_action',
                          notes: notes
                        });
                      }}
                    >
                      ❌ Dismiss Report
                    </button>
                    <button 
                      className="close-btn"
                      onClick={() => setShowReportModal(false)}
                    >
                      🔒 Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
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
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Reports
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
        {activeTab === 'reports' && renderReports()}
        {activeTab === 'moderators' && renderModerators()}
        {activeTab === 'settings' && renderSettings()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>

      {/* User Management Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content user-management-modal">
            <div className="modal-header">
              <h3>
                {selectedRole === 'admin' ? '👑 Promote to Admin' : '🛡️ Promote to Moderator'}
              </h3>
              <button 
                className="modal-close-btn"
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="Search users by email or name..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="user-search-input"
                />
              </div>
              
              <div className="users-list">
                {userModalLoading ? (
                  <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading users...</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="empty-state">
                    <p>No users found</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div key={user.id} className="user-card">
                      <div className="user-info">
                        <div className="user-avatar">
                          {user.profile?.picture ? (
                            <img src={user.profile.picture} alt="Avatar" />
                          ) : (
                            <div className="avatar-placeholder">👤</div>
                          )}
                        </div>
                        <div className="user-details">
                          <h4>{user.profile?.name || 'No Name'}</h4>
                          <p>{user.email}</p>
                          <div className="user-roles">
                            {user.isAdmin && <span className="role-badge admin">👑 Admin</span>}
                            {user.isModerator && <span className="role-badge moderator">🛡️ Moderator</span>}
                            {!user.isAdmin && !user.isModerator && (
                              <span className="role-badge user">👤 User</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="user-actions">
                        {user.isAdmin ? (
                          <button 
                            className="demote-btn admin"
                            onClick={() => handleDemoteUser(user.id, 'admin')}
                            disabled={userModalLoading}
                          >
                            👑 Demote Admin
                          </button>
                        ) : user.isModerator ? (
                          <button 
                            className="demote-btn moderator"
                            onClick={() => handleDemoteUser(user.id, 'moderator')}
                            disabled={userModalLoading}
                          >
                            🛡️ Demote Moderator
                          </button>
                        ) : (
                          <button 
                            className={`promote-btn ${selectedRole}`}
                            onClick={() => handlePromoteUser(user.id, selectedRole)}
                            disabled={userModalLoading}
                          >
                            {selectedRole === 'admin' ? '👑 Promote to Admin' : '🛡️ Promote to Moderator'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel; 