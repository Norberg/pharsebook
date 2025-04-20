import React, { useState, useEffect, useCallback, useRef } from "react"; // Import React explicitly
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import SearchBar from "./components/SearchBar";
import PhraseList from "./components/PhraseList";
import AddPhraseForm from "./components/AddPhraseForm";
import Settings from "./components/Settings";
import { getPhrases, addPhrase, removePhrase, syncDefaultPhrases, overwriteLocalPhrases, Phrase } from "./utils/phraseUtils"; // Import overwriteLocalPhrases
import { categories, getCategoryIcon } from "./components/categories";
import { FaCog } from "react-icons/fa";

const App = () => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"main" | "settings">("main");
  const editFormRef = useRef<HTMLDivElement | null>(null); // Create a ref for the edit form

  useEffect(() => {
    const fetchPhrases = async () => {
      const data = await getPhrases();
      setPhrases(data);
      setFilteredPhrases(data); // Initialize filteredPhrases with all phrases
    };
    fetchPhrases();
  }, []);

  const handleSearch = useCallback((query: string) => {
    if (editingPhrase || showForm) {
      setEditingPhrase(null);
      setShowForm(false);
    }
    if (query === "") {
      setFilteredPhrases(phrases);
      setHasSearched(false);
    }
    if (query.length < 3){
      return;
    }
    setHasSearched(true);
    const lowerQuery = query.toLowerCase();
    const filtered = phrases.filter(
      (phrase) =>
        phrase.original.toLowerCase().includes(lowerQuery) ||
        phrase.translation.toLowerCase().includes(lowerQuery)
    );
    setFilteredPhrases(filtered);
  }, [phrases, editingPhrase, showForm]);

  const handleAddPhrase = async (newPhrase: Phrase) => {
    if (!categories.includes(newPhrase.category)) {
      alert("Invalid category");
      return;
    }

    // Check if the phrase already exists
    const exists = phrases.some(
      (p) =>
        p.original.toLowerCase() === newPhrase.original.toLowerCase() &&
        p.translation.toLowerCase() === newPhrase.translation.toLowerCase()
    );
    if (exists) {
      alert("This phrase already exists!");
      return;
    }

    await addPhrase(newPhrase);
    setPhrases((prev) => [...prev, newPhrase]);
    if (hasSearched) {
      setFilteredPhrases((prev) => [...prev, newPhrase]);
    }
    setShowForm(false);
  };

  const handleEditPhrase = async (updatedPhrase: Phrase) => {
    if (!categories.includes(updatedPhrase.category)) {
      alert("Invalid category");
      return;
    }

    // Check if the updated phrase already exists (excluding the one being edited)
    const exists = phrases.some(
      (p) =>
        p.original.toLowerCase() === updatedPhrase.original.toLowerCase() &&
        p.translation.toLowerCase() === updatedPhrase.translation.toLowerCase() &&
        p.compositeKey !== editingPhrase?.compositeKey
    );
    if (exists) {
      alert("This phrase already exists!");
      return;
    }

    if (editingPhrase) {
      await removePhrase(editingPhrase);
    }
    await addPhrase(updatedPhrase);
    setPhrases((prev) =>
      prev.map((p) =>
        p.original === editingPhrase?.original &&
        p.translation === editingPhrase?.translation
          ? updatedPhrase
          : p
      )
    );
    if (hasSearched) {
      setFilteredPhrases((prev) =>
        prev.map((p) =>
          p.original === editingPhrase?.original &&
          p.translation === editingPhrase?.translation
            ? updatedPhrase
            : p
        )
      );
    }
    setEditingPhrase(null);
    setShowForm(false);
  };

  const handleDeletePhrase = async () => {
    if (editingPhrase) {
      await removePhrase(editingPhrase);
      setPhrases((prev) =>
        prev.filter(
          (p) =>
            !(p.original === editingPhrase.original && p.translation === editingPhrase.translation)
        )
      );
      if (hasSearched) {
        setFilteredPhrases((prev) =>
          prev.filter(
            (p) =>
              !(p.original === editingPhrase.original && p.translation === editingPhrase.translation)
          )
        );
      }
      setEditingPhrase(null);
      setShowForm(false);
    }
  };

  const handleExport = () => {
    const sortedPhrases = [...phrases].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
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

  const handleSyncDefaults = async () => {
    await syncDefaultPhrases();
    const data = await getPhrases();
    setPhrases(data);
    if (hasSearched) {
      setFilteredPhrases(data);
    }
  };

  const handleOverwritePhrases = async (): Promise<{ removedCount: number; addedCount: number }> => {
    return await overwriteLocalPhrases();
  };

  const handleEditClick = (phrase: Phrase) => {
    setEditingPhrase(phrase);
    setShowForm(true);
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll to the edit form
    }, 0);
  };

  if (view === "settings") {
    return (
      <Settings
        onBack={() => setView("main")}
        onExport={handleExport}
        onSync={handleSyncDefaults}
        onOverwrite={handleOverwritePhrases} // Pass the updated overwrite handler
      />
    );
  }

  return (
    <div className="app-container">
      <div className="header">
        <SearchBar onSearch={handleSearch} />
        <button className="settings-button" onClick={() => setView("settings")}>
          <FaCog />
        </button>
      </div>
      <PhraseList
        phrases={filteredPhrases}
        categoryIcons={Object.fromEntries(
          categories.map((category) => [category, getCategoryIcon(category)])
        )}
        onEdit={handleEditClick} // Use the new handleEditClick function
        expandAll={hasSearched}
      />
      {(editingPhrase || showForm) ? (
        <div ref={editFormRef}>
          <AddPhraseForm
            onAddPhrase={handleAddPhrase}
            categories={categories}
            phraseToEdit={editingPhrase || undefined}
            onEditPhrase={handleEditPhrase}
            onCancel={() => {
              setEditingPhrase(null);
              setShowForm(false);
            }}
            onDelete={handleDeletePhrase}
          />
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}>Lägg till Fras</button>
      )}
    </div>
  );
};

export default App;
