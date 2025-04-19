import { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import SearchBar from "./components/SearchBar";
import PhraseList from "./components/PhraseList";
import { getPhrases, Phrase } from "./utils/phraseUtils";

const App = () => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const fetchPhrases = async () => {
      const data = await getPhrases();
      setPhrases(data);
    };
    fetchPhrases();
  }, []);

  const handleSearch = useCallback((query: string) => {
    setHasSearched(true);
    const lowerQuery = query.toLowerCase();
    const filtered = phrases.filter(
      (phrase) =>
        phrase.original.toLowerCase().includes(lowerQuery) ||
        phrase.translation.toLowerCase().includes(lowerQuery)
    );
    setFilteredPhrases(filtered);
  }, [phrases]);

  return (
    <div className="app">
      <SearchBar onSearch={handleSearch} />
      {hasSearched ? (
        <PhraseList phrases={filteredPhrases} />
      ) : (
        <p>Start by searching for phrases...</p>
      )}
    </div>
  );
};

export default App;
