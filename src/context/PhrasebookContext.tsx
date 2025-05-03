import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  Phrase,
  Category,
  getPhrases,
  addPhrase,
  updatePhrase,
  removePhrase,
  getCategories,
  addCategory,
  updateCategory,
  removeCategory,
  syncWithSupabase,
  mergeWithSupabase,
  applyLocalOnly,
  applySupabaseOnly,
} from "../utils/storageUtils";

// Context value type
export type PhrasebookContextType = {
  phrases: Phrase[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshPhrases: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  addPhrase: (p: Omit<Phrase, 'compositeKey'>) => Promise<void>;
  updatePhrase: (p: Phrase, oldKey?: string) => Promise<void>;
  removePhrase: (p: Phrase) => Promise<void>;
  addCategory: (c: Category) => Promise<void>;
  updateCategory: (c: Category) => Promise<void>;
  removeCategory: (name: string) => Promise<void>;
  syncWithSupabase: typeof syncWithSupabase;
  mergeWithSupabase: typeof mergeWithSupabase;
  applyLocalOnly: typeof applyLocalOnly;
  applySupabaseOnly: typeof applySupabaseOnly;
};

// Create the context
export const PhrasebookContext = createContext<PhrasebookContextType | undefined>(undefined);

// Provider component
export const PhrasebookProvider = ({ children }: { children: ReactNode }) => {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load phrases and categories on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [phr, cat] = await Promise.all([
          getPhrases(),
          getCategories()
        ]);
        setPhrases(phr);
        setCategories(cat);
        setError(null);
      } catch (e: any) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Refresh phrases from persistent storage
  const refreshPhrases = async () => {
    setLoading(true);
    try {
      const phr = await getPhrases();
      setPhrases(phr);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to refresh phrases");
    } finally {
      setLoading(false);
    }
  };

  // Refresh categories from persistent storage
  const refreshCategories = async () => {
    setLoading(true);
    try {
      const cat = await getCategories();
      setCategories(cat);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to refresh categories");
    } finally {
      setLoading(false);
    }
  };

  // Add, update, remove phrase/category methods
  const handleAddPhrase = async (p: Omit<Phrase, 'compositeKey'>) => {
    await addPhrase(p);
    await refreshPhrases();
  };
  const handleUpdatePhrase = async (p: Phrase, oldKey?: string) => {
    await updatePhrase(p, oldKey);
    await refreshPhrases();
  };
  const handleRemovePhrase = async (p: Phrase) => {
    await removePhrase(p);
    await refreshPhrases();
  };
  const handleAddCategory = async (c: Category) => {
    await addCategory(c);
    await refreshCategories();
  };
  const handleUpdateCategory = async (c: Category) => {
    await updateCategory(c);
    await refreshCategories();
  };
  const handleRemoveCategory = async (name: string) => {
    await removeCategory(name);
    await refreshCategories();
  };



  // Provide all state and methods to consumers
  return (
    <PhrasebookContext.Provider
      value={{
        phrases,
        categories,
        loading,
        error,
        refreshPhrases,
        refreshCategories,
        addPhrase: handleAddPhrase,
        updatePhrase: handleUpdatePhrase,
        removePhrase: handleRemovePhrase,
        addCategory: handleAddCategory,
        updateCategory: handleUpdateCategory,
        removeCategory: handleRemoveCategory,
        syncWithSupabase,
        mergeWithSupabase,
        applyLocalOnly,
        applySupabaseOnly,
      }}
    >
      {children}
    </PhrasebookContext.Provider>
  );
};

// Custom hook for easier usage
export const usePhrasebook = () => {
  const ctx = useContext(PhrasebookContext);
  if (!ctx) throw new Error("usePhrasebook must be used within a PhrasebookProvider");
  return ctx;
};