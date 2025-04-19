import React, { useEffect, useState, useCallback } from "react";
import SearchBar from "../components/SearchBar";
import { getPhrases, Phrase } from "../utils/phraseUtils";

const Phrasebook: React.FC = () => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);

  useEffect(() => {
    const fetchPhrases = async () => {
      const data = await getPhrases();
      setPhrases(data);
      setFilteredPhrases(data);
    };
    fetchPhrases();
  }, []);

  const handleSearch = useCallback((query: string) => {
    console.log("Search query received:", query); // Logga sökfrågan
    console.log("Current phrases:", phrases); // Logga alla fraser
    const lowerQuery = query.toLowerCase();
    const filtered = phrases.filter(
      (phrase) =>
        phrase.original.toLowerCase().includes(lowerQuery) ||
        phrase.translation.toLowerCase().includes(lowerQuery)
    );
    console.log("Filtered phrases:", filtered); // Logga filtrerade fraser
    setFilteredPhrases(filtered);
  }, [phrases]);

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <ul>
        {filteredPhrases.map((phrase, index) => (
          <li key={index}>
            <strong>{phrase.original}</strong> - {phrase.translation}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Phrasebook;
