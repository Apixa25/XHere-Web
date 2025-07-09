import React, { useState, useEffect } from 'react';
import reportAppealService from '../services/reportAppealService';
import './TransparencyDashboard.css';

const TransparencyDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await reportAppealService.getTransparencyData(timeRange);
      setDashboardData(data);
    } catch (err) {
      setError('Failed to load transparency data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRange = (range) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 90 Days';
      default: return 'Last 30 Days';
    }
  };

  const formatResolutionTime = (seconds) => {
    if (!seconds) return 'N/A';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ff4757';
      case 'high': return '#ffa502';
      case 'medium': return '#2ed573';
      case 'low': return '#70a1ff';
      default: return '#747d8c';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved': return '#2ed573';
      case 'pending': return '#ffa502';
      case 'under_review': return '#70a1ff';
      case 'dismissed': return '#747d8c';
      default: return '#747d8c';
    }
  };

  if (loading) {
    return (
      <div className="transparency-dashboard">
        <div className="dashboard-header">
          <h1>📊 Transparency Dashboard</h1>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transparency-dashboard">
        <div className="dashboard-header">
          <h1>📊 Transparency Dashboard</h1>
          <div className="error-message">❌ {error}</div>
          <button onClick={loadDashboardData} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="transparency-dashboard">
        <div className="dashboard-header">
          <h1>📊 Transparency Dashboard</h1>
          <div className="no-data">No data available</div>
        </div>
      </div>
    );
  }

  // Add defensive programming to handle missing data
  const safeData = {
    totalReports: dashboardData.totalReports || 0,
    totalAppeals: dashboardData.totalAppeals || 0,
    reportsByType: dashboardData.reportsByType || {},
    recentReports: dashboardData.recentReports || [],
    recentAppeals: dashboardData.recentAppeals || [],
    moderationActions: dashboardData.moderationActions || []
  };

  return (
    <div className="transparency-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>📊 Transparency Dashboard</h1>
          <button 
            onClick={() => window.history.back()} 
            className="back-to-map-button"
          >
            ← Back to Map
          </button>
        </div>
        <div className="time-range-selector">
          <label>Time Range:</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">📝</div>
            <div className="card-content">
              <h3>Total Reports</h3>
              <div className="card-value">{safeData.totalReports}</div>
              <div className="card-period">{formatTimeRange(timeRange)}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">⚖️</div>
            <div className="card-content">
              <h3>Total Appeals</h3>
              <div className="card-value">{safeData.totalAppeals}</div>
              <div className="card-period">{formatTimeRange(timeRange)}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">📊</div>
            <div className="card-content">
              <h3>Reports by Type</h3>
                              <div className="card-value">
                  {Object.values(safeData.reportsByType).reduce((sum, count) => sum + count, 0)}
                </div>
              <div className="card-period">Total Reports</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>Generated</h3>
              <div className="card-value">
                {new Date().toLocaleDateString()}
              </div>
              <div className="card-period">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Report Statistics */}
        <div className="stats-section">
          <h2>📊 Report Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Reports by Type</h3>
              <div className="stat-list">
                {Object.entries(safeData.reportsByType).map(([type, count]) => (
                  <div key={type} className="stat-item">
                    <span className="stat-label">{type}</span>
                    <span className="stat-value">{count}</span>
                    <span className="stat-status">
                      {type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="stat-card">
              <h3>Recent Reports</h3>
              <div className="stat-list">
                {safeData.recentReports.slice(0, 5).map((report) => (
                  <div key={report.id} className="stat-item">
                    <span className="stat-label">{report.reportType}</span>
                    <span className="stat-value">{report.status}</span>
                    <span 
                      className="stat-status" 
                      style={{ backgroundColor: getStatusColor(report.status) }}
                    >
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Moderator Activity */}
        {safeData.moderationActions.length > 0 && (
          <div className="stats-section">
            <h2>👥 Recent Moderation Actions</h2>
            <div className="moderator-grid">
              {safeData.moderationActions.slice(0, 5).map((action, index) => (
                <div key={index} className="moderator-card">
                  <div className="moderator-info">
                    <div className="moderator-email">{action.moderator?.name || 'Unknown'}</div>
                    <div className="moderator-stats">
                      <span className="stat-badge">
                        {action.type} - {action.locationId}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Health Metrics */}
        <div className="stats-section">
          <h2>🏥 Community Health</h2>
          <div className="health-metrics">
            <div className="metric-card">
              <h3>Total Reports</h3>
              <div className="metric-value">
                {safeData.totalReports}
              </div>
              <div className="metric-description">
                Total reports submitted in this period
              </div>
            </div>

            <div className="metric-card">
              <h3>Total Appeals</h3>
              <div className="metric-value">
                {safeData.totalAppeals}
              </div>
              <div className="metric-description">
                Total appeals submitted in this period
              </div>
            </div>

            <div className="metric-card">
              <h3>Report Types</h3>
              <div className="metric-value">
                {Object.keys(safeData.reportsByType).length}
              </div>
              <div className="metric-description">
                Different types of reports submitted
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="stats-section">
          <h2>📅 Recent Activity</h2>
          <div className="activity-timeline">
            <div className="timeline-item">
              <div className="timeline-icon">📝</div>
              <div className="timeline-content">
                <div className="timeline-title">Reports Submitted</div>
                <div className="timeline-value">{safeData.totalReports}</div>
                <div className="timeline-period">{formatTimeRange(timeRange)}</div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon">⚖️</div>
              <div className="timeline-content">
                <div className="timeline-title">Appeals Submitted</div>
                <div className="timeline-value">{safeData.totalAppeals}</div>
                <div className="timeline-period">{formatTimeRange(timeRange)}</div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon">📊</div>
              <div className="timeline-content">
                <div className="timeline-title">Report Types</div>
                <div className="timeline-value">
                  {Object.keys(safeData.reportsByType).length}
                </div>
                <div className="timeline-period">Different Types</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransparencyDashboard; 