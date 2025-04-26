import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import SearchBar from "./components/SearchBar";
import PhraseList from "./components/PhraseList";
import AddPhraseForm from "./components/AddPhraseForm";
import Settings from "./components/Settings";
import { getPhrases, addPhrase, updatePhrase, removePhrase, syncDefaultPhrases, overwriteLocalPhrases, Phrase, ensureCompositeKey } from "./utils/phraseUtils";
import { useCategories, getCategoryIcon } from "./components/categories";
import { FaCog } from "react-icons/fa";

const App = () => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"main" | "settings">("main");
  const editFormRef = useRef<HTMLDivElement | null>(null);
  const dynamicCats = useCategories();

  useEffect(() => {
    getPhrases().then(data => setPhrases(data));
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 3) {
      setHasSearched(true);
      const q = searchQuery.toLowerCase();
      setFilteredPhrases(
        phrases.filter(
          p =>
            p.original.toLowerCase().includes(q) ||
            p.translation.toLowerCase().includes(q)
        )
      );
    } else {
      setHasSearched(false);
      setFilteredPhrases(phrases);
    }
  }, [phrases, searchQuery]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
  };

  const handleAddPhrase = async (newP: Phrase) => {
    const exists = phrases.some(
      (p) =>
        p.original.toLowerCase() === newP.original.toLowerCase() &&
        p.translation.toLowerCase() === newP.translation.toLowerCase()
    );
    if (exists) {
      alert("This phrase already exists!");
      return;
    }
    await addPhrase(newP);
    setPhrases(prev => [...prev, newP]);
    setShowForm(false);
  };

  const handleEditPhrase = async (updated: Phrase) => {
    const exists = phrases.some(
      (p) =>
        p.original.toLowerCase() === updated.original.toLowerCase() &&
        p.translation.toLowerCase() === updated.translation.toLowerCase() &&
        p.compositeKey !== editingPhrase?.compositeKey
    );
    if (exists) {
      alert("This phrase already exists!");
      return;
    }

    const oldKey = editingPhrase!.compositeKey!;
    const updatedWithKey = ensureCompositeKey(updated);

    await updatePhrase(updatedWithKey, oldKey);

    setPhrases((prev) =>
      prev.map((p) =>
        p.compositeKey === oldKey ? updatedWithKey : p
      )
    );
    setEditingPhrase(null);
    setShowForm(false);
  };

  const handleDeletePhrase = async (toDelete: Phrase) => {
    await removePhrase(toDelete);
    setPhrases(prev =>
      prev.filter(p => p.compositeKey !== toDelete.compositeKey)
    );
    setEditingPhrase(null);
    setShowForm(false);
  };

  const generateExportData = (): string => {
    const sortedPhrases = [...phrases].sort(
      (a, b) => new Date(a.created).getTime() - new Date(b.created).getTime()
    );
    const exportData = sortedPhrases.map(({ compositeKey, ...rest }) => rest);
    return JSON.stringify(exportData, null, 2);
  };

  const handleSyncDefaults = async () => {
    await syncDefaultPhrases();
    const data = await getPhrases();
    setPhrases(data);
  };

  const handleOverwritePhrases = async (): Promise<{ removedCount: number; addedCount: number }> => {
    const result = await overwriteLocalPhrases();
    const data = await getPhrases();
    setPhrases(data);
    return result;
  };

  const handleEditClick = (phrase: Phrase) => {
    setEditingPhrase(phrase);
    setShowForm(true);
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  if (view === "settings") {
    return (
      <Settings
        onBack={() => setView("main")}
        onExport={async () => generateExportData()}
        onSync={handleSyncDefaults}
        onOverwrite={handleOverwritePhrases}
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
          dynamicCats.map(c => [c.name, getCategoryIcon(c.name, dynamicCats)])
        )}
        onEdit={handleEditClick}
        expandAll={hasSearched}
      />
      {(editingPhrase || showForm) ? (
        <div ref={editFormRef}>
          <AddPhraseForm
            onAddPhrase={handleAddPhrase}
            phraseToEdit={editingPhrase || undefined}
            onEditPhrase={handleEditPhrase}
            onCancel={() => {
              setEditingPhrase(null);
              setShowForm(false);
            }}
            onDelete={() => handleDeletePhrase(editingPhrase!)}
          />
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}>Lägg till Fras</button>
      )}
    </div>
  );
};

export default App;
