import React, { useState } from 'react';
import '../styles/KeywordSearch.css';

const KeywordSearch = ({ onSearch, placeholder = "Search by keywords..." }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <div className="keyword-search-container">
      <form onSubmit={handleSearch} className="keyword-search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="keyword-search-input"
        />
        <button type="submit" className="keyword-search-button">
          🔍
        </button>
        {searchTerm && (
          <button 
            type="button" 
            onClick={handleClear}
            className="keyword-clear-button"
          >
            ✕
          </button>
        )}
      </form>
    </div>
  );
};

export default KeywordSearch; 