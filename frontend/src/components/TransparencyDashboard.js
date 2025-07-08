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
      
      const data = await reportAppealService.getTransparencyDashboard(timeRange);
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

  return (
    <div className="transparency-dashboard">
      <div className="dashboard-header">
        <h1>📊 Transparency Dashboard</h1>
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
              <div className="card-value">{dashboardData.summary.totalReports}</div>
              <div className="card-period">{formatTimeRange(timeRange)}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">⚖️</div>
            <div className="card-content">
              <h3>Total Appeals</h3>
              <div className="card-value">{dashboardData.summary.totalAppeals}</div>
              <div className="card-period">{formatTimeRange(timeRange)}</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">⏱️</div>
            <div className="card-content">
              <h3>Avg Resolution Time</h3>
              <div className="card-value">
                {formatResolutionTime(dashboardData.summary.averageResolutionTime)}
              </div>
              <div className="card-period">Per Report</div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">📅</div>
            <div className="card-content">
              <h3>Generated</h3>
              <div className="card-value">
                {new Date(dashboardData.generatedAt).toLocaleDateString()}
              </div>
              <div className="card-period">
                {new Date(dashboardData.generatedAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Report Statistics */}
        <div className="stats-section">
          <h2>📊 Report Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Report Types</h3>
              <div className="stat-list">
                {Object.entries(dashboardData.reportStats).map(([key, count]) => {
                  const [status, type] = key.split('_');
                  return (
                    <div key={key} className="stat-item">
                      <span className="stat-label">{type}</span>
                      <span className="stat-value">{count}</span>
                      <span 
                        className="stat-status" 
                        style={{ backgroundColor: getStatusColor(status) }}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="stat-card">
              <h3>Appeal Statistics</h3>
              <div className="stat-list">
                {Object.entries(dashboardData.appealStats).map(([key, count]) => {
                  const [status, decision] = key.split('_');
                  return (
                    <div key={key} className="stat-item">
                      <span className="stat-label">{decision}</span>
                      <span className="stat-value">{count}</span>
                      <span 
                        className="stat-status" 
                        style={{ backgroundColor: getStatusColor(status) }}
                      >
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Moderator Activity */}
        {dashboardData.moderatorActivity && dashboardData.moderatorActivity.length > 0 && (
          <div className="stats-section">
            <h2>👥 Moderator Activity</h2>
            <div className="moderator-grid">
              {dashboardData.moderatorActivity.map((moderator, index) => (
                <div key={index} className="moderator-card">
                  <div className="moderator-info">
                    <div className="moderator-email">{moderator.moderator?.email || 'Unknown'}</div>
                    <div className="moderator-stats">
                      <span className="stat-badge">
                        📝 {moderator.reportsResolved} Reports Resolved
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
              <h3>Report Response Rate</h3>
              <div className="metric-value">
                {dashboardData.summary.totalReports > 0 
                  ? Math.round((dashboardData.summary.totalReports / dashboardData.summary.totalReports) * 100)
                  : 0}%
              </div>
              <div className="metric-description">
                Percentage of reports that received a response
              </div>
            </div>

            <div className="metric-card">
              <h3>Appeal Success Rate</h3>
              <div className="metric-value">
                {dashboardData.summary.totalAppeals > 0 
                  ? Math.round((dashboardData.appealStats.approved_location_restored || 0) / dashboardData.summary.totalAppeals * 100)
                  : 0}%
              </div>
              <div className="metric-description">
                Percentage of appeals that were successful
              </div>
            </div>

            <div className="metric-card">
              <h3>Average Resolution Time</h3>
              <div className="metric-value">
                {formatResolutionTime(dashboardData.summary.averageResolutionTime)}
              </div>
              <div className="metric-description">
                Average time to resolve reports
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
                <div className="timeline-value">{dashboardData.summary.totalReports}</div>
                <div className="timeline-period">{formatTimeRange(timeRange)}</div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon">⚖️</div>
              <div className="timeline-content">
                <div className="timeline-title">Appeals Submitted</div>
                <div className="timeline-value">{dashboardData.summary.totalAppeals}</div>
                <div className="timeline-period">{formatTimeRange(timeRange)}</div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-icon">⏱️</div>
              <div className="timeline-content">
                <div className="timeline-title">Avg Response Time</div>
                <div className="timeline-value">
                  {formatResolutionTime(dashboardData.summary.averageResolutionTime)}
                </div>
                <div className="timeline-period">Per Report</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransparencyDashboard; 