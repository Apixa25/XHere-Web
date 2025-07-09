import React, { useState } from 'react';
import './ReportReviewModal.css';

const ReportReviewModal = ({ report, onClose, onResolve }) => {
  const [resolution, setResolution] = useState({
    status: 'resolved',
    action: 'remove_location',
    notes: '',
    notifyReporter: true,
    notifyLocationOwner: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!resolution.notes.trim()) {
      setError('Please provide resolution notes');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await onResolve(report.id, resolution);
    } catch (err) {
      setError('Failed to resolve report: ' + err.message);
    } finally {
      setLoading(false);
    }
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

  const renderEvidence = () => {
    if (!report.evidence || report.evidence.length === 0) {
      return <p className="no-evidence">No evidence provided</p>;
    }

    return (
      <div className="evidence-section">
        {report.evidence.map((item, index) => (
          <div key={index} className="evidence-item">
            <div className="evidence-header">
              <span className="evidence-type">{item.type}</span>
              <span className="evidence-date">{formatDate(item.createdAt)}</span>
            </div>
            <div className="evidence-content">
              {item.type === 'text' && (
                <p className="evidence-text">{item.content}</p>
              )}
              {item.type === 'image' && (
                <div className="evidence-image">
                  <img src={item.content} alt="Evidence" />
                </div>
              )}
              {item.type === 'file' && (
                <div className="evidence-file">
                  <span className="file-icon">📎</span>
                  <span className="file-name">{item.filename}</span>
                  <a href={item.content} target="_blank" rel="noopener noreferrer">
                    View File
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="report-review-modal-overlay" onClick={onClose}>
      <div className="report-review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔍 Review Report</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>

        <div className="modal-content">
          {/* Report Overview */}
          <div className="report-overview">
            <div className="overview-header">
              <div className="report-type-section">
                <span className="type-icon">{getReportTypeIcon(report.reportType)}</span>
                <div className="type-details">
                  <h3>{report.reportType}</h3>
                  <p className="report-id">ID: {report.id}</p>
                </div>
              </div>
              <div className="report-meta">
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: getPriorityColor(report.priority) }}
                >
                  {report.priority}
                </span>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(report.status) }}
                >
                  {report.status}
                </span>
              </div>
            </div>

            <div className="report-details">
              <div className="detail-row">
                <strong>Reported:</strong> {formatDate(report.createdAt)}
              </div>
              <div className="detail-row">
                <strong>Reporter:</strong> {report.reporter?.profile?.name || report.reporter?.email || 'Anonymous'}
              </div>
              <div className="detail-row">
                <strong>Reason:</strong> {report.reason}
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="location-section">
            <h3>📍 Location Details</h3>
            <div className="location-info">
              <div className="location-name">
                <strong>Name:</strong> {report.location?.content?.text || 'Unknown'}
              </div>
              <div className="location-coordinates">
                <strong>Coordinates:</strong> {report.location?.content?.coordinates?.lat}, {report.location?.content?.coordinates?.lng}
              </div>
              <div className="location-type">
                <strong>Type:</strong> {report.location?.content?.type || 'Unknown'}
              </div>
              <div className="location-owner">
                <strong>Owner:</strong> {report.location?.user?.profile?.name || report.location?.user?.email || 'Unknown'}
              </div>
              <div className="location-created">
                <strong>Created:</strong> {report.location?.createdAt ? formatDate(report.location.createdAt) : 'Unknown'}
              </div>
            </div>
          </div>

          {/* Evidence Section */}
          <div className="evidence-section-container">
            <h3>📋 Evidence</h3>
            {renderEvidence()}
          </div>

          {/* Resolution Form */}
          <div className="resolution-section">
            <h3>⚖️ Resolution</h3>
            <form onSubmit={handleSubmit} className="resolution-form">
              <div className="form-group">
                <label>Action:</label>
                <select 
                  value={resolution.action} 
                  onChange={(e) => setResolution(prev => ({ ...prev, action: e.target.value }))}
                  required
                >
                  <option value="remove_location">Remove Location</option>
                  <option value="warn_location_owner">Warn Location Owner</option>
                  <option value="flag_for_review">Flag for Manual Review</option>
                  <option value="dismiss_report">Dismiss Report</option>
                  <option value="ban_user">Ban User</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status:</label>
                <select 
                  value={resolution.status} 
                  onChange={(e) => setResolution(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="resolved">Resolved</option>
                  <option value="dismissed">Dismissed</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>

              <div className="form-group">
                <label>Resolution Notes:</label>
                <textarea 
                  value={resolution.notes}
                  onChange={(e) => setResolution(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Provide detailed notes about your decision..."
                  rows="4"
                  required
                />
              </div>

              <div className="notification-options">
                <h4>Notifications</h4>
                <div className="checkbox-group">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={resolution.notifyReporter}
                      onChange={(e) => setResolution(prev => ({ ...prev, notifyReporter: e.target.checked }))}
                    />
                    Notify Reporter
                  </label>
                  <label>
                    <input 
                      type="checkbox" 
                      checked={resolution.notifyLocationOwner}
                      onChange={(e) => setResolution(prev => ({ ...prev, notifyLocationOwner: e.target.checked }))}
                    />
                    Notify Location Owner
                  </label>
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <p>❌ {error}</p>
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="resolve-btn"
                  disabled={loading}
                >
                  {loading ? '🔄 Resolving...' : '✅ Resolve Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportReviewModal; 