import React, { useState, useEffect } from 'react';
import reportAppealService from '../services/reportAppealService';
import ReportReviewModal from './ReportReviewModal';
import './ModeratorDashboard.css';

const ModeratorDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    reportType: 'all',
    timeRange: '7d'
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [stats, setStats] = useState({
    pending: 0,
    underReview: 0,
    resolved: 0,
    total: 0
  });

  useEffect(() => {
    loadReports();
  }, [filters, sortBy, sortOrder]);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await reportAppealService.getReportsForReview({
        ...filters,
        sortBy,
        sortOrder
      });
      
      setReports(data.reports || []);
      setStats(data.stats || {
        pending: 0,
        underReview: 0,
        resolved: 0,
        total: 0
      });
    } catch (err) {
      setError('Failed to load reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReportClick = (report) => {
    setSelectedReport(report);
    setShowReviewModal(true);
  };

  const handleReportResolved = async (reportId, resolution) => {
    try {
      await reportAppealService.resolveReport(reportId, resolution);
      
      // Update the reports list
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === reportId 
            ? { ...report, status: resolution.status }
            : report
        )
      );
      
      // Refresh stats
      loadReports();
      
      setShowReviewModal(false);
      setSelectedReport(null);
    } catch (err) {
      setError('Failed to resolve report: ' + err.message);
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
      case 'pending': return '#ffa502';
      case 'under_review': return '#70a1ff';
      case 'resolved': return '#2ed573';
      case 'dismissed': return '#747d8c';
      default: return '#747d8c';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  const getReportTypeIcon = (type) => {
    const icons = {
      spam: '🚨',
      inappropriate: '⚠️',
      duplicate: '🔄',
      fake: '🎭',
      offensive: '😠',
      other: '❓'
    };
    return icons[type] || '📝';
  };

  if (loading) {
    return (
      <div className="moderator-dashboard">
        <div className="dashboard-header">
          <div className="header-top">
            <h1>🛡️ Moderator Dashboard</h1>
            <button 
              onClick={() => window.history.back()} 
              className="back-to-map-button"
            >
              ← Back to Map
            </button>
          </div>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="moderator-dashboard">
        <div className="dashboard-header">
          <div className="header-top">
            <h1>🛡️ Moderator Dashboard</h1>
            <button 
              onClick={() => window.history.back()} 
              className="back-to-map-button"
            >
              ← Back to Map
            </button>
          </div>
          <div className="error-message">
            <h3>❌ Error Loading Reports</h3>
            <p>{error}</p>
            <button onClick={loadReports} className="retry-button">
              🔄 Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="moderator-dashboard">
      <div className="dashboard-header">
        <div className="header-top">
          <h1>🛡️ Moderator Dashboard</h1>
          <button 
            onClick={() => window.history.back()} 
            className="back-to-map-button"
          >
            ← Back to Map
          </button>
        </div>
        <p>Review and resolve community reports</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending</h3>
            <div className="stat-value">{stats.pending}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <h3>Under Review</h3>
            <div className="stat-value">{stats.underReview}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Resolved</h3>
            <div className="stat-value">{stats.resolved}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total</h3>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="controls-section">
        <div className="filters">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select 
              value={filters.priority} 
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select 
              value={filters.reportType} 
              onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
            >
              <option value="all">All Types</option>
              <option value="spam">Spam</option>
              <option value="inappropriate">Inappropriate</option>
              <option value="duplicate">Duplicate</option>
              <option value="fake">Fake</option>
              <option value="offensive">Offensive</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Time Range:</label>
            <select 
              value={filters.timeRange} 
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        <div className="sort-controls">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createdAt">Date Created</option>
            <option value="priority">Priority</option>
            <option value="reportType">Report Type</option>
            <option value="status">Status</option>
          </select>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="sort-order-btn"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="reports-section">
        <h2>📋 Reports ({reports.length})</h2>
        
        {reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No reports found</h3>
            <p>No reports match your current filters.</p>
            <button onClick={() => setFilters({
              status: 'all',
              priority: 'all',
              reportType: 'all',
              timeRange: '7d'
            })} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div 
                key={report.id} 
                className="report-card"
                onClick={() => handleReportClick(report)}
              >
                <div className="report-header">
                  <div className="report-type">
                    <span className="type-icon">{getReportTypeIcon(report.reportType)}</span>
                    <span className="type-label">{report.reportType}</span>
                  </div>
                  <div className="report-priority">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(report.priority) }}
                    >
                      {report.priority}
                    </span>
                  </div>
                </div>

                <div className="report-content">
                  <div className="report-reason">
                    <strong>Reason:</strong> {report.reason.substring(0, 100)}
                    {report.reason.length > 100 && '...'}
                  </div>
                  
                  <div className="report-location">
                    <strong>Location:</strong> {report.location?.content?.text || 'Unknown'}
                  </div>
                  
                  <div className="report-reporter">
                    <strong>Reporter:</strong> {report.reporter?.profile?.name || report.reporter?.email || 'Anonymous'}
                  </div>
                </div>

                <div className="report-footer">
                  <div className="report-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(report.status) }}
                    >
                      {report.status}
                    </span>
                  </div>
                  <div className="report-date">
                    {formatDate(report.createdAt)}
                  </div>
                </div>

                <div className="report-actions">
                  <button 
                    className="review-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReportClick(report);
                    }}
                  >
                    🔍 Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Report Review Modal */}
      {showReviewModal && selectedReport && (
        <ReportReviewModal
          report={selectedReport}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedReport(null);
          }}
          onResolve={handleReportResolved}
        />
      )}
    </div>
  );
};

export default ModeratorDashboard; 