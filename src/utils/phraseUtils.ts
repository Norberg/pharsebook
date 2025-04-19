import { openDB } from "idb";
import phrasesData from "../data/phrases.json";
console.log("Loaded phrases data:", phrasesData); // Lägg till denna logg

export interface Phrase {
  created: string;
  original: string;
  translation: string;
  category: string;
  favorite: boolean;
  compositeKey?: string;
}

const DB_NAME = "PhrasebookDB";
const STORE_NAME = "phrases";

// Helper function to generate the composite key
const withCompositeKey = (phrase: Phrase): Phrase =>
  ({ ...phrase, compositeKey: phrase.original + "::" + phrase.translation });

export const initDatabase = async () => {
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Use the composite key as the keyPath
        const store = db.createObjectStore(STORE_NAME, { keyPath: "compositeKey" });
        store.createIndex("category", "category");
        store.createIndex("favorite", "favorite");
      }
    },
  });

  // Get all existing phrases
  const existing = await db.getAll(STORE_NAME);
  // Create a set of existing composite keys
  const existingKeys = new Set(existing.map((p) => p.compositeKey));
  let newCount = 0;

  // Always add phrases from the data that do not exist (by original & translation)
  for (const phrase of phrasesData) {
    const phraseWithKey = withCompositeKey(phrase);
    if (!existingKeys.has(phraseWithKey.compositeKey)) {
      await db.add(STORE_NAME, phraseWithKey);
      newCount++;
    }
  }
  console.log(`Added ${newCount} new phrases. DB now contains ${existing.length + newCount} phrases total.`);
  return db;
};

export const getPhrases = async (query?: string): Promise<Phrase[]> => {
  const db = await initDatabase();
  const allPhrases = await db.getAll(STORE_NAME);

  if (!query) return allPhrases;

  const lowerQuery = query.toLowerCase();
  return allPhrases.filter(
    (phrase) =>
      phrase.original.toLowerCase().includes(lowerQuery) ||
      phrase.translation.toLowerCase().includes(lowerQuery)
  );
};

export const addPhrase = async (phrase: Phrase) => {
  const db = await initDatabase();
  await db.add(STORE_NAME, withCompositeKey(phrase));
};

export const updatePhrase = async (phrase: Phrase) => {
  const db = await initDatabase();
  await db.put(STORE_NAME, withCompositeKey(phrase));
};

export const deletePhrase = async (original: string, translation: string) => {
  const db = await initDatabase();
  const compositeKey = original + "::" + translation;
  await db.delete(STORE_NAME, compositeKey);
};
