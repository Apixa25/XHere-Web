import React, { useState } from 'react';
import reportAppealService from '../services/reportAppealService';
import './ReportLocationModal.css';

const ReportLocationModal = ({ isOpen, onClose, location, onReportSubmitted }) => {
  const [formData, setFormData] = useState({
    reportType: '',
    reason: '',
    evidence: [],
    isAnonymous: false,
    contactEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reportTypes = [
    { value: 'spam', label: '🚫 Spam', description: 'Repeated or unwanted content' },
    { value: 'inappropriate', label: '⚠️ Inappropriate', description: 'Content that violates community guidelines' },
    { value: 'duplicate', label: '🔄 Duplicate', description: 'Same location posted multiple times' },
    { value: 'fake', label: '❌ Fake', description: 'Location that does not exist' },
    { value: 'offensive', label: '😡 Offensive', description: 'Hateful or harmful content' },
    { value: 'other', label: '📝 Other', description: 'Other issues not listed above' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEvidenceUpload = (e) => {
    const files = Array.from(e.target.files);
    const evidenceItems = files.map(file => ({
      type: 'file',
      name: file.name,
      size: file.size,
      file: file
    }));
    
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...evidenceItems]
    }));
  };

  const removeEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }));
  };

  const addTextEvidence = () => {
    const textEvidence = prompt('Please provide additional details or evidence:');
    if (textEvidence && textEvidence.trim()) {
      setFormData(prev => ({
        ...prev,
        evidence: [...prev.evidence, {
          type: 'text',
          content: textEvidence.trim(),
          timestamp: new Date().toISOString()
        }]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.reportType || !formData.reason) {
      setError('Please select a report type and provide a reason');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Prepare evidence data
      const evidenceData = formData.evidence.map(item => {
        if (item.type === 'text') {
          return {
            type: 'text',
            content: item.content,
            timestamp: item.timestamp
          };
        } else {
          return {
            type: 'file',
            name: item.name,
            size: item.size
            // Note: File upload would need to be handled separately
          };
        }
      });

      const reportData = {
        locationId: location.id,
        reportType: formData.reportType,
        reason: formData.reason,
        evidence: evidenceData,
        isAnonymous: formData.isAnonymous,
        contactEmail: formData.contactEmail
      };

      const result = await reportAppealService.submitReport(reportData);
      
      setSuccess(`Report submitted successfully! Priority: ${result.priority}`);
      
      // Reset form
      setFormData({
        reportType: '',
        reason: '',
        evidence: [],
        isAnonymous: false,
        contactEmail: ''
      });

      // Notify parent component
      if (onReportSubmitted) {
        onReportSubmitted(result);
      }

      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        reportType: '',
        reason: '',
        evidence: [],
        isAnonymous: false,
        contactEmail: ''
      });
      setError('');
      setSuccess('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay">
      <div className="report-modal">
        <div className="report-modal-header">
          <h2>📝 Report Location</h2>
          <button 
            className="close-button" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <div className="report-modal-content">
          <div className="location-info">
            <h3>📍 {location.name}</h3>
            <p>{location.description}</p>
            <span className="location-type">{location.locationType}</span>
          </div>

          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label htmlFor="reportType">Report Type *</label>
              <select
                id="reportType"
                name="reportType"
                value={formData.reportType}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              >
                <option value="">Select a report type...</option>
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="reason">Reason for Report *</label>
              <textarea
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                placeholder="Please provide a detailed explanation of why you're reporting this location..."
                rows="4"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Evidence (Optional)</label>
              <div className="evidence-section">
                <div className="evidence-actions">
                  <button
                    type="button"
                    onClick={() => document.getElementById('evidence-upload').click()}
                    disabled={isSubmitting}
                    className="evidence-btn"
                  >
                    📎 Upload Files
                  </button>
                  <button
                    type="button"
                    onClick={addTextEvidence}
                    disabled={isSubmitting}
                    className="evidence-btn"
                  >
                    📝 Add Text Evidence
                  </button>
                </div>
                
                <input
                  id="evidence-upload"
                  type="file"
                  multiple
                  onChange={handleEvidenceUpload}
                  style={{ display: 'none' }}
                  disabled={isSubmitting}
                />

                {formData.evidence.length > 0 && (
                  <div className="evidence-list">
                    <h4>Evidence Items:</h4>
                    {formData.evidence.map((item, index) => (
                      <div key={index} className="evidence-item">
                        <span>
                          {item.type === 'file' ? `📎 ${item.name}` : `📝 Text evidence`}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEvidence(index)}
                          disabled={isSubmitting}
                          className="remove-evidence-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                Submit anonymously
              </label>
            </div>

            {formData.isAnonymous && (
              <div className="form-group">
                <label htmlFor="contactEmail">Contact Email (Optional)</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="your-email@example.com"
                  disabled={isSubmitting}
                />
                <small>We'll use this to contact you about your report if needed</small>
              </div>
            )}

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            {success && (
              <div className="success-message">
                ✅ {success}
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.reportType || !formData.reason}
                className="submit-btn"
              >
                {isSubmitting ? '📤 Submitting...' : '📤 Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportLocationModal; 