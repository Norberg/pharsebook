import React, { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (query.length >= 3 || query.length === 0) {
      onSearch(query);
    }
  }, [query]);

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search phrases..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
