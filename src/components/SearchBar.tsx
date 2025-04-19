import React, { useState, useEffect } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    console.log("Triggering onSearch with query:", query); // Logga när onSearch anropas
    if (query.length >= 3 || query.length === 0) {
      console.log("Calling onSearch prop with:", query); // Verifiera att onSearch anropas
      onSearch(query);
    }
  }, [query]); 

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search phrases..."
        value={query}
        onChange={(e) => {
          console.log("Input value changed to:", e.target.value); // Logga inputvärdet
          setQuery(e.target.value);
        }}
      />
    </div>
  );
};

export default SearchBar;
