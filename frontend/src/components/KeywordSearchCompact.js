import React, { useState } from 'react';
import './KeywordSearchCompact.css';

const KeywordSearchCompact = ({ onSearch, placeholder = "Search keywords..." }) => {
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
    <form className="ksc-form" onSubmit={handleSearch} autoComplete="off">
      <input
        type="text"
        className="ksc-input"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder={placeholder}
      />
      <button type="submit" className="ksc-btn ksc-search">Search</button>
      {searchTerm && (
        <button type="button" className="ksc-btn ksc-clear" onClick={handleClear}>Clear</button>
      )}
    </form>
  );
};

export default KeywordSearchCompact; 