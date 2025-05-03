// --- Internal sync helpers (not exported) ---

async function pullPhrasesFromSupabaseToLocal() {
  if (!navigator.onLine) throw new Error("Cannot sync from Supabase: No internet connection.");
  const { data, error } = await supabase
    .from("phrases")
    .select("*");
  if (error) throw error;
  if (data) {
    const db = await initDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.clear();
    for (const supabasePhrase of data) {
      const localPhrase = ensureCompositeKey({
        created: supabasePhrase.created,
        original: supabasePhrase.original,
        translation: supabasePhrase.translation,
        category: supabasePhrase.category,
        favorite: supabasePhrase.favorite,
      });
      await tx.store.put(localPhrase);
    }
    await tx.done;
  }
}

async function pushLocalPhrasesToSupabase() {
  if (!navigator.onLine) throw new Error("Cannot sync to Supabase: No internet connection.");
  const db = await initDatabase();
  const localPhrases = await db.getAll(STORE_NAME);
  // Ta bort remote phrases som inte finns lokalt
  const localKeys = new Set(localPhrases.map(p => `${p.original}::${p.translation}`));
  const { data: remoteRows, error: fetchErr } = await supabase
    .from("phrases")
    .select("original,translation");
  if (fetchErr) throw fetchErr;
  const toDelete = (remoteRows || [])
    .filter(r => !localKeys.has(`${r.original}::${r.translation}`));
  for (const row of toDelete) {
    await supabase
      .from("phrases")
      .delete()
      .match({ original: row.original, translation: row.translation });
  }
  // Upserta alla lokala phrases
  if (localPhrases.length > 0) {
    const supabasePhrases = localPhrases.map(p => ({
      created: p.created,
      original: p.original,
      translation: p.translation,
      category: p.category,
      favorite: p.favorite,
    }));
    const { error } = await supabase
      .from("phrases")
      .upsert(supabasePhrases)
      .select();
    if (error) throw error;
  }
}
import { openDB, IDBPDatabase } from "idb";
import phrasesData from "../data/phrases.json";
import categoriesData from "../data/categories.json";
import { supabase } from "./supabaseClient"; // Use shared client

// Phrase object interface
export interface Phrase {
  created: string; // ISO 8601 format for compatibility
  original: string;
  translation: string;
  category: string;
  favorite: boolean;
  compositeKey?: string;
}

// Category object interface
export interface Category {
  name: string;
  icon: string;
  position: number;
}

const DB_NAME = "PhrasebookDB";
const STORE_NAME = "phrases";
const CAT_STORE = "categories";
const SUPA_PHRASE_TABLE = "phrases";
const SUPA_CAT_TABLE = "categories";

// --- IndexedDB Functions ---

// Helper to generate the composite key
export const ensureCompositeKey = (phrase: Omit<Phrase, 'compositeKey'> | Phrase): Phrase => {
  const key = `${phrase.original}::${phrase.translation}`;
  if ('compositeKey' in phrase && phrase.compositeKey && phrase.compositeKey !== key) {
      console.warn("Composite key mismatch for:", phrase);
  }
  return { ...phrase, compositeKey: key };
};

// Initialize IndexedDB and populate with JSON data if empty
export const initDatabase = async (): Promise<IDBPDatabase> => {
  const db = await openDB(DB_NAME, 2, {
    async blocked() {
      console.warn("Database is blocked. Please close all other tabs using this database.");
    },
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const ps = db.createObjectStore(STORE_NAME, { keyPath: "compositeKey" });
        ps.createIndex("category", "category");
        ps.createIndex("favorite", "favorite");
        console.log("Created/Upgraded object store with compositeKey");
      }
      if (!db.objectStoreNames.contains(CAT_STORE)) {
        const cs = db.createObjectStore(CAT_STORE, { keyPath: "name" });
        cs.createIndex("position", "position");
        console.log("Created/Upgraded categories store");
      }
    },
  });

  // populate phrases if empty
  const pCount = await db.transaction(STORE_NAME).store.count();
  if (pCount === 0) {
    console.log("IndexedDB is empty, populating phrases with initial data from JSON...");
    const tx = db.transaction(STORE_NAME, "readwrite");
    for (const p of phrasesData) {
      await tx.store.add(ensureCompositeKey(p as any));
    }
    await tx.done;
    console.log(`Added default phrases from JSON to IndexedDB.`);
  }

  // populate categories if empty
  const cCount = await db.transaction(CAT_STORE).store.count();
  if (cCount === 0) {
    console.log("IndexedDB is empty, populating categories with initial data from JSON...");
    const tx = db.transaction(CAT_STORE, "readwrite");
    for (const c of categoriesData) {
      await tx.store.add(c);
    }
    await tx.done;
    console.log(`Added default categories from JSON to IndexedDB.`);
  }

  return db;
};

// --- Manual Sync Functions ---


// Restore diff interface
export interface SyncDiff {
  same: boolean;
  localOnly: Phrase[];
  supabaseOnly: Phrase[];
  changed: { local: Phrase; supabase: Phrase }[];
}

// Compute diff without mutating anything
export async function syncWithSupabase(): Promise<SyncDiff> {
  const local = await getPhrases();
  const { data: supa } = await supabase
    .from("phrases")
    .select("*");

  const byKey = (p: Phrase) => `${p.original}→${p.translation}`;
  const localMap = new Map(local.map(p => [byKey(p), p]));
  const supaMap = new Map((supa||[]).map(p => [byKey(p), p]));

  const localOnly = local.filter(p => !supaMap.has(byKey(p)));
  const supabaseOnly = (supa||[]).filter(p => !localMap.has(byKey(p)));

  const changed: { local: Phrase; supabase: Phrase }[] = [];
  for (const [key, localP] of localMap) {
    const supaP = supaMap.get(key);
    if (supaP) {
      if (localP.category !== supaP.category || localP.favorite !== supaP.favorite) {
        changed.push({ local: localP, supabase: supaP });
      }
    }
  }

  return {
    same: localOnly.length === 0 && supabaseOnly.length === 0 && changed.length === 0,
    localOnly,
    supabaseOnly,
    changed
  };
}

// Merge uniques both ways
export async function mergeWithSupabase(): Promise<void> {
  // compute diff
  const diff = await syncWithSupabase();
  // push local-only phrases
  if (diff.localOnly.length) {
    await supabase
      .from(SUPA_PHRASE_TABLE)
      .upsert(diff.localOnly.map(p => ({
        created: p.created,
        original: p.original,
        translation: p.translation,
        category: p.category,
        favorite: p.favorite,
      })));
  }
  // pull supabase-only phrases locally
  if (diff.supabaseOnly.length) {
    const db = await initDatabase();
    const tx = db.transaction(STORE_NAME, "readwrite");
    for (const p of diff.supabaseOnly) {
      await tx.store.put(ensureCompositeKey(p));
    }
    await tx.done;
  }
  // now merge categories
  await mergeCategories();
}

// Overwrite local store with Supabase
export async function applySupabaseOnly() {
  // Pull supabase‐only phrases & categories to local
  await pullPhrasesFromSupabaseToLocal();
  await syncCategoriesFromSupabase();
}

// --- Category CRUD & sync ---

/**
 * Fetches categories from IndexedDB.
 */
export const getCategories = async (): Promise<Category[]> => {
  const db = await initDatabase();
  return db.getAllFromIndex(CAT_STORE, "position");
};

/**
 * Adds a category to IndexedDB.
 */
export const addCategory = async (cat: Category) => {
  const db = await initDatabase();
  await db.add(CAT_STORE, cat);
};

/**
 * Updates a category in IndexedDB.
 */
export const updateCategory = async (cat: Category) => {
  const db = await initDatabase();
  await db.put(CAT_STORE, cat);
};

/**
 * Removes a category from IndexedDB by its name.
 */
export const removeCategory = async (name: string) => {
  const db = await initDatabase();
  await db.delete(CAT_STORE, name);
};

/**
 * Fetches all categories from Supabase and overwrites local IndexedDB.
 */
export const syncCategoriesFromSupabase = async (): Promise<void> => {
  if (!navigator.onLine) throw new Error("Offline");
  const { data, error } = await supabase.from(SUPA_CAT_TABLE).select("*");
  if (error) throw error;
  const db = await initDatabase();
  const tx = db.transaction(CAT_STORE, "readwrite");
  await tx.store.clear();
  for (const c of data || []) {
    await tx.store.add(c as Category);
  }
  await tx.done;
};

/**
 * Sends all local categories to Supabase (inserts new, updates existing).
 */
export const syncCategoriesToSupabase = async (): Promise<void> => {
  if (!navigator.onLine) throw new Error("Offline");
  const cats = await getCategories();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error("Not authenticated");

  // fetch remote category names
  const { data: remoteRows, error: fetchErr } = await supabase
    .from(SUPA_CAT_TABLE)
    .select("name");
  if (fetchErr) throw fetchErr;

  const localNames = new Set(cats.map(c => c.name));
  // remove remote categories not present locally
  for (const r of remoteRows || []) {
    if (!localNames.has(r.name)) {
      await supabase
        .from(SUPA_CAT_TABLE)
        .delete()
        .match({ name: r.name });
    }
  }

  // upsert local categories with user_id
  const catsWithUserId = cats.map(cat => ({ ...cat, user_id: userId }));
  const { error: upErr } = await supabase
    .from(SUPA_CAT_TABLE)
    .upsert(catsWithUserId);
  if (upErr) throw upErr;
};

/**
 * Merges categories between local IndexedDB and Supabase.
 */
export async function mergeCategories(): Promise<void> {
  const local = await getCategories();
  const { data: supa, error } = await supabase.from(SUPA_CAT_TABLE).select("*");
  if (error) throw error;
  const localNames = new Set(local.map(c => c.name));
  const supaNames = new Set((supa||[]).map(c => c.name));

  // push local-only cats to Supabase
  const toUpsert = local.filter(c => !supaNames.has(c.name));
  if (toUpsert.length) {
    const { error: upErr } = await supabase.from(SUPA_CAT_TABLE).upsert(toUpsert);
    if (upErr) throw upErr;
  }

  // pull supabase-only cats locally
  const db = await initDatabase();
  const tx = db.transaction(CAT_STORE, "readwrite");
  for (const cat of (supa||[]).filter(c => !localNames.has(c.name))) {
    await tx.store.add(cat as Category);
  }
  await tx.done;
}

// --- Local CRUD operations (IndexedDB only) ---

/**
 * Fetches phrases from IndexedDB.
 */
export const getPhrases = async (query?: string): Promise<Phrase[]> => {
  const db = await initDatabase();
  const allPhrasesRaw = await db.getAll(STORE_NAME);
  // Ensure all fields exist and favorite is always boolean
  const allPhrases: Phrase[] = allPhrasesRaw.map((p) => ({
    created: p.created,
    original: p.original,
    translation: p.translation,
    category: p.category,
    favorite: typeof p.favorite === "boolean" ? p.favorite : false,
    compositeKey: p.compositeKey,
  }));
  console.log(`Fetched ${allPhrases.length} phrases from local IndexedDB`);

  if (!query) return allPhrases;

  const lowerQuery = query.toLowerCase();
  return allPhrases.filter(
    (phrase) =>
      phrase.original.toLowerCase().includes(lowerQuery) ||
      phrase.translation.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Adds a phrase to IndexedDB.
 */
export const addPhrase = async (phrase: Omit<Phrase, 'compositeKey'>): Promise<void> => {
  const db = await initDatabase();
  const phraseWithKey = ensureCompositeKey(phrase);
  try {
    await db.add(STORE_NAME, phraseWithKey);
    console.log("Phrase added to local DB.");
  } catch (error: any) {
     console.error("Error adding phrase to local DB:", error);
      if (error.name !== 'ConstraintError') {
           throw error;
      } else {
          console.warn(`Phrase with key \"${phraseWithKey.compositeKey}\" already exists locally.`);
          // Consider updating instead if desired
          // await updatePhrase(phraseWithKey);
      }
  }
};

/**
 * Updates a phrase in IndexedDB.
 * Removes the old phrase if the compositeKey has changed.
 */
export const updatePhrase = async (
  phrase: Phrase,
  oldCompositeKey?: string
): Promise<void> => {
  const db = await initDatabase();
  const phraseWithKey = ensureCompositeKey(phrase);
  try {
    if (oldCompositeKey && oldCompositeKey !== phraseWithKey.compositeKey) {
      await db.delete(STORE_NAME, oldCompositeKey);
    }
    await db.put(STORE_NAME, phraseWithKey);
    console.log("Phrase updated/put locally.");
  } catch (error: any) {
    console.error("Error updating/putting phrase locally:", error);
    throw error;
  }
};

/**
 * Removes a phrase from IndexedDB by its compositeKey.
 */
export const removePhrase = async (phrase: Phrase): Promise<void> => {
  const db = await initDatabase();
  // ensure we have a proper compositeKey
  const { compositeKey: key } = ensureCompositeKey(phrase);
  try {
    await db.delete(STORE_NAME, key!);
    console.log(`Phrase with key \"${key}\" removed locally.`);
  } catch(error) {
    console.error(`Error removing phrase with key \"${key}\" locally:`, error);
    throw error;
  }
};

/**
 * Adds missing default phrases from JSON to local DB, but does not remove any.
 */
export const syncDefaultPhrases = async (): Promise<void> => {
  const db = await initDatabase();
  const existing = await db.getAll(STORE_NAME);
  const existingKeys = new Set(existing.map((p) => p.compositeKey));
  let newCount = 0;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const phrase of phrasesData) {
    const phraseWithKey = ensureCompositeKey(phrase as Omit<Phrase, 'compositeKey'>);
    if (!existingKeys.has(phraseWithKey.compositeKey)) {
      await tx.store.add(phraseWithKey);
      newCount++;
    }
  }
  await tx.done;
  console.log(`Synced ${newCount} default phrases from JSON manually to local DB.`);
};

/**
 * Overwrites all local phrases with those from JSON.
 * Returns number of removed and added phrases.
 */
export const overwriteLocalPhrases = async (): Promise<{ removedCount: number; addedCount: number }> => {
  const db = await initDatabase();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const existing = await tx.store.getAll();
  const existingKeys = new Set(existing.map((p) => p.compositeKey));

  const jsonPhrasesWithKeys = phrasesData.map(p => ensureCompositeKey(p as Omit<Phrase, 'compositeKey'>));
  const jsonKeys = new Set(jsonPhrasesWithKeys.map(p => p.compositeKey));

  const removedCount = existing.filter(p => !jsonKeys.has(p.compositeKey!)).length;
  const addedCount = jsonPhrasesWithKeys.filter(p => !existingKeys.has(p.compositeKey)).length;

  await tx.store.clear();
  for (const phrase of jsonPhrasesWithKeys) {
    await tx.store.add(phrase);
  }
  await tx.done;

  console.log(`Overwrote local phrases from JSON. Removed approx ${removedCount}, added ${addedCount}.`);
  return { removedCount, addedCount };
};

export async function applyLocalOnly() {
  await pushLocalPhrasesToSupabase();
  await syncCategoriesToSupabase();
}
