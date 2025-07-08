import React, { useState, useEffect } from 'react';
import api from '../services/api';

const REPORT_TYPES = {
  spam: { label: 'Spam', icon: '🚨', description: 'Unwanted commercial content' },
  inappropriate: { label: 'Inappropriate', icon: '⚠️', description: 'Offensive or harmful content' },
  duplicate: { label: 'Duplicate', icon: '🔄', description: 'Already exists elsewhere' },
  fake: { label: 'Fake', icon: '🎭', description: 'False or misleading information' },
  offensive: { label: 'Offensive', icon: '😠', description: 'Hate speech or harassment' },
  other: { label: 'Other', icon: '❓', description: 'Other issues' }
};

const LocationReportModal = ({ location, onClose }) => {
  const [formData, setFormData] = useState({
    reportType: '',
    reason: '',
    evidence: '',
    isAnonymous: false,
    contactEmail: ''
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [checkingExistingReport, setCheckingExistingReport] = useState(true);
  const [existingReport, setExistingReport] = useState(null);

  // Check if user has already reported this location
  useEffect(() => {
    const checkExistingReport = async () => {
      try {
        const response = await api.get(`/reports/check-existing?locationId=${location.id}`);
        if (response.success && response.hasExistingReport) {
          setExistingReport(response.existingReport);
        }
      } catch (error) {
        console.error('Error checking existing report:', error);
        // If we can't check, allow the form to proceed
      } finally {
        setCheckingExistingReport(false);
      }
    };

    checkExistingReport();
  }, [location.id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.reportType) {
      errors.reportType = 'Please select a report type';
    }
    
    if (!formData.reason.trim()) {
      errors.reason = 'Please provide a reason for the report';
    } else if (formData.reason.trim().length < 10) {
      errors.reason = 'Reason must be at least 10 characters long';
    }
    
    if (formData.isAnonymous && !formData.contactEmail) {
      errors.contactEmail = 'Please provide an email for anonymous reports';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare evidence data
      const evidenceData = [];
      
      // Add text evidence
      if (formData.evidence.trim()) {
        evidenceData.push({
          type: 'text',
          content: formData.evidence.trim(),
          metadata: { timestamp: new Date().toISOString() }
        });
      }
      
      // Add file evidence (simulated - in real app you'd upload files)
      if (files.length > 0) {
        evidenceData.push({
          type: 'files',
          content: `Attached ${files.length} file(s): ${files.map(f => f.name).join(', ')}`,
          metadata: { 
            timestamp: new Date().toISOString(),
            fileCount: files.length,
            fileNames: files.map(f => f.name)
          }
        });
      }
      
      // Prepare report data
      const reportData = {
        locationId: location.id,
        reportType: formData.reportType,
        reason: formData.reason.trim(),
        evidence: evidenceData,
        isAnonymous: formData.isAnonymous,
        contactEmail: formData.contactEmail || null
      };
      
      console.log('📝 Submitting report:', reportData);
      
      // Submit to backend API
      const response = await api.post('/reports/submit', reportData);
      
      if (response.success) {
        console.log('✅ Report submitted successfully:', response);
        setSuccess(true);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to submit report');
      }
      
    } catch (error) {
      console.error('❌ Error submitting report:', error);
      setError(error.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  // Show loading state while checking for existing report
  if (checkingExistingReport) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: '#fff',
          padding: '32px',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '90vw',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ marginBottom: '8px' }}>Checking...</h3>
          <p style={{ color: '#666' }}>Verifying if you've already reported this location</p>
        </div>
      </div>
    );
  }

  // Show existing report message
  if (existingReport) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: '#fff',
          padding: '32px',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '90vw',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h2 style={{ color: '#FF9800', marginBottom: '8px' }}>Already Reported</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            You have already reported this location on{' '}
            {new Date(existingReport.createdAt).toLocaleDateString()}.
          </p>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Your Previous Report:
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>Type:</strong> {REPORT_TYPES[existingReport.reportType]?.label || existingReport.reportType}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>Status:</strong> {existingReport.status}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <strong>Reason:</strong> {existingReport.reason}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: '#fff',
          padding: '32px',
          borderRadius: '12px',
          maxWidth: '400px',
          width: '90vw',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ color: '#4CAF50', marginBottom: '8px' }}>Report Submitted!</h2>
          <p style={{ color: '#666', marginBottom: '16px' }}>
            Thank you for helping keep our community safe. Your report has been received and will be reviewed by our moderation team.
          </p>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Report ID: {location.id}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 16px 24px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>🚨 Report Location</h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
          >
            ×
          </button>
        </div>

        {/* Location Info */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
            Reporting location:
          </div>
          <div style={{ fontWeight: 'bold', color: '#333' }}>
            {location.content?.text || 'Location'}
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
            ID: {location.id}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Report Type */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Report Type *
            </label>
            <select
              value={formData.reportType}
              onChange={(e) => handleInputChange('reportType', e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: validationErrors.reportType ? '2px solid #f44336' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
              disabled={submitting}
            >
              <option value="">Select a report type...</option>
              {Object.entries(REPORT_TYPES).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.icon} {type.label} - {type.description}
                </option>
              ))}
            </select>
            {validationErrors.reportType && (
              <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
                {validationErrors.reportType}
              </div>
            )}
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Reason for Report *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Please provide a detailed explanation of why you're reporting this location..."
              style={{
                width: '100%',
                padding: '12px',
                border: validationErrors.reason ? '2px solid #f44336' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '100px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              disabled={submitting}
            />
            {validationErrors.reason && (
              <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
                {validationErrors.reason}
              </div>
            )}
          </div>

          {/* Evidence */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Additional Evidence (Optional)
            </label>
            <textarea
              value={formData.evidence}
              onChange={(e) => handleInputChange('evidence', e.target.value)}
              placeholder="Any additional details, screenshots, or evidence that supports your report..."
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              disabled={submitting}
            />
          </div>

          {/* File Upload */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
              Attach Files (Optional)
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              disabled={submitting}
            />
            {files.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                Selected files: {files.map(f => f.name).join(', ')}
              </div>
            )}
          </div>

          {/* Anonymous Report */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => handleInputChange('isAnonymous', e.target.checked)}
                style={{ marginRight: '8px' }}
                disabled={submitting}
              />
              <span style={{ fontSize: '14px', color: '#333' }}>
                Submit anonymously
              </span>
            </label>
          </div>

          {/* Contact Email for Anonymous Reports */}
          {formData.isAnonymous && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="your-email@example.com"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: validationErrors.contactEmail ? '2px solid #f44336' : '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                disabled={submitting}
              />
              {validationErrors.contactEmail && (
                <div style={{ color: '#f44336', fontSize: '12px', marginTop: '4px' }}>
                  {validationErrors.contactEmail}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                We'll use this to contact you about your report if needed.
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              ❌ {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '24px'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#e0e0e0')}
              onMouseOut={(e) => !submitting && (e.target.style.backgroundColor = '#f5f5f5')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px',
                backgroundColor: submitting ? '#ccc' : '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => !submitting && (e.target.style.backgroundColor = '#d32f2f')}
              onMouseOut={(e) => !submitting && (e.target.style.backgroundColor = '#f44336')}
            >
              {submitting ? 'Submitting...' : '🚨 Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LocationReportModal; 