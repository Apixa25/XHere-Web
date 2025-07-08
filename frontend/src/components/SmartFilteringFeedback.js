import React, { useState, useEffect, useCallback, useRef } from 'react';
import smartFilteringService from '../services/smartFilteringService';
import '../styles/SmartFilteringFeedback.css';

const SmartFilteringFeedback = ({ locationData, userData, onAnalysisComplete }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const isAnalyzing = useRef(false);

  const performAnalysis = useCallback(async () => {
    if (!locationData?.text?.trim()) return;
    
    // Prevent multiple simultaneous analyses
    if (isAnalyzing.current) return;

    isAnalyzing.current = true;
    setLoading(true);
    setError(null);

    try {
      const analysisResult = await smartFilteringService.getRealTimeFeedback(locationData, userData);
      setAnalysis(analysisResult);
      
      // Notify parent component of analysis completion
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult);
      }
    } catch (err) {
      console.error('Smart filtering analysis failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      isAnalyzing.current = false;
    }
  }, [locationData?.text, userData?.userId, onAnalysisComplete]);

  useEffect(() => {
    if (locationData && locationData.text && locationData.text.trim()) {
      // Debounce the analysis to avoid too many API calls
      const timeoutId = setTimeout(() => {
        performAnalysis();
      }, 1000);

      return () => clearTimeout(timeoutId);
    } else {
      setAnalysis(null);
      setError(null);
    }
  }, [locationData?.text, userData?.userId, performAnalysis]);

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      case 'critical': return 'critical';
      default: return 'info';
    }
  };

  const getRiskLevelIcon = (level) => {
    switch (level) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'approve': return '✅';
      case 'review': return '⏳';
      case 'reject': return '❌';
      case 'escalate': return '🚨';
      default: return '❓';
    }
  };

  if (!locationData?.text?.trim()) {
    return null;
  }

  return (
    <div className="smart-filtering-feedback">
      {loading && (
        <div className="feedback-loading">
          <div className="loading-spinner"></div>
          <span>Analyzing content...</span>
        </div>
      )}

      {error && (
        <div className="feedback-error">
          <span className="error-icon">⚠️</span>
          <span>Analysis temporarily unavailable</span>
        </div>
      )}

      {analysis && !loading && (
        <div className={`feedback-content ${getRiskLevelColor(analysis.riskLevel || 'low')}`}>
          <div className="feedback-header">
            <span className="risk-icon">{getRiskLevelIcon(analysis.riskLevel || 'low')}</span>
            <span className="risk-level">Risk Level: {(analysis.riskLevel || 'low').toUpperCase()}</span>
            <span className="risk-score">Score: {(analysis.riskScore || 0).toFixed(2)}</span>
            <button 
              className="details-toggle"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div className="feedback-message">
            {analysis.feedbackMessage || analysis.message || 'Analysis completed'}
          </div>

          {showDetails && (
            <div className="feedback-details">
              <div className="analysis-breakdown">
                <h6>Analysis Breakdown:</h6>
                <div className="breakdown-item">
                  <span>Duplicate Detection:</span>
                  <span className={`score ${(analysis.duplicateDetection?.score || 0) > 0.7 ? 'high' : 'low'}`}>
                    {(analysis.duplicateDetection?.score || 0).toFixed(2)}
                  </span>
                  <span className="details">{analysis.duplicateDetection?.details || 'No duplicate detection data'}</span>
                </div>
                <div className="breakdown-item">
                  <span>Behavioral Analysis:</span>
                  <span className={`score ${(analysis.behavioralAnalysis?.score || 0) > 0.7 ? 'high' : 'low'}`}>
                    {(analysis.behavioralAnalysis?.score || 0).toFixed(2)}
                  </span>
                  <span className="details">{analysis.behavioralAnalysis?.details || 'No behavioral analysis data'}</span>
                </div>
                <div className="breakdown-item">
                  <span>Content Quality:</span>
                  <span className={`score ${(analysis.contentQuality?.score || 0) > 0.7 ? 'high' : 'low'}`}>
                    {(analysis.contentQuality?.score || 0).toFixed(2)}
                  </span>
                  <span className="details">{analysis.contentQuality?.details || 'No content quality data'}</span>
                </div>
              </div>

              {(analysis.recommendations?.length > 0 || analysis.flags?.length > 0) && (
                <div className="recommendations">
                  <h6>Suggestions:</h6>
                  <ul>
                    {analysis.recommendations?.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                    {analysis.flags?.map((flag, index) => (
                      <li key={`flag-${index}`}>⚠️ {flag}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="suggested-action">
                <h6>Suggested Action:</h6>
                <div className={`action-badge ${analysis.suggestedAction || analysis.action || 'review'}`}>
                  <span className="action-icon">{getActionIcon(analysis.suggestedAction || analysis.action || 'review')}</span>
                  <span className="action-text">{(analysis.suggestedAction || analysis.action || 'review').toUpperCase()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartFilteringFeedback; 