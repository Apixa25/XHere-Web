import React from 'react';
import '../styles/KeywordsDisplay.css';

const KeywordsDisplay = ({ keywords, maxDisplay = 5, showAll = false }) => {
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return null;
  }

  const displayKeywords = showAll ? keywords : keywords.slice(0, maxDisplay);
  const hasMore = !showAll && keywords.length > maxDisplay;

  return (
    <div className="keywords-display">
      {displayKeywords.map((keyword, index) => (
        <span key={index} className="keyword-tag">
          #{keyword}
        </span>
      ))}
      {hasMore && (
        <span className="keyword-more">
          +{keywords.length - maxDisplay} more
        </span>
      )}
    </div>
  );
};

export default KeywordsDisplay; 