import { useState, useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import SearchBar from "./components/SearchBar";
import PhraseList from "./components/PhraseList";
import AddPhraseForm from "./components/AddPhraseForm";
import { getPhrases, addPhrase, Phrase } from "./utils/phraseUtils";
import { categories, getCategoryIcon } from "./components/categories";

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

  const handleAddPhrase = async (newPhrase: Phrase) => {
    if (!categories.includes(newPhrase.category)) {
      alert("Invalid category");
      return;
    }
    await addPhrase(newPhrase);
    setPhrases((prevPhrases) => [...prevPhrases, newPhrase]);
    if (hasSearched) {
      setFilteredPhrases((prevFiltered) => [...prevFiltered, newPhrase]);
    }
  };

  const handleExport = () => {
    const sortedPhrases = [...phrases].sort((a, b) =>
      new Date(a.created).getTime() - new Date(b.created).getTime()
    );
    const exportData = sortedPhrases.map(({ compositeKey, ...rest }) => rest);
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "phrases.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="app-container">
      <SearchBar onSearch={handleSearch} />
      {hasSearched ? (
        <PhraseList
          phrases={filteredPhrases}
          categoryIcons={Object.fromEntries(
            categories.map((category) => [category, getCategoryIcon(category)])
          )}
        />
      ) : (
        <p>Start by searching for phrases...</p>
      )}
      <AddPhraseForm onAddPhrase={handleAddPhrase} categories={categories} />
      <button onClick={handleExport}>Export Phrases</button>
    </div>
  );
};

export default App;
