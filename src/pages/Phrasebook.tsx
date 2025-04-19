import React, { useEffect, useState } from "react";
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

  const handleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    setFilteredPhrases(
      phrases.filter(
        (phrase) =>
          phrase.original.toLowerCase().includes(lowerQuery) ||
          phrase.translation.toLowerCase().includes(lowerQuery)
      )
    );
  };

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
