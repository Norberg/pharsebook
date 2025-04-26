import { openDB, IDBPDatabase } from "idb";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import phrasesData from "../data/phrases.json";

// Interface för frasobjektet
export interface Phrase {
  // id behövs inte längre eftersom vi använder composite key
  created: string; // ISO 8601 format för kompatibilitet
  original: string;
  translation: string;
  category: string;
  favorite: boolean;
  compositeKey?: string;
}

const DB_NAME = "PhrasebookDB";
const STORE_NAME = "phrases";
const SUPABASE_URL = "https://pymzmxwikuxsxwlwgmpe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5bXpteHdpa3V4c3h3bHdnbXBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDEyNDQsImV4cCI6MjA2MTE3NzI0NH0.DqaKxHMDbsoi9XJ_sxyoKlJnGglEG00DIKhxLCUkFGU";

// Skapa Supabase-klient
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Supabase tabellnamn
const SUPABASE_TABLE = 'phrases';

// --- IndexedDB Funktioner ---

// Helper function to generate the composite key
const ensureCompositeKey = (phrase: Omit<Phrase, 'compositeKey'> | Phrase): Phrase => {
  const key = `${phrase.original}::${phrase.translation}`;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if ('compositeKey' in phrase && phrase.compositeKey && phrase.compositeKey !== key) {
      console.warn("Composite key mismatch for:", phrase);
  }
  return { ...phrase, compositeKey: key };
};


// Initiera IndexedDB
export const initDatabase = async (): Promise<IDBPDatabase> => {
  const db = await openDB(DB_NAME, 1, { // Version 1 är tillräcklig nu
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Använd compositeKey som keyPath, matchar Supabase primärnyckel
        const store = db.createObjectStore(STORE_NAME, { keyPath: "compositeKey" });
        store.createIndex("category", "category");
        store.createIndex("favorite", "favorite");
        console.log("Created/Upgraded object store with compositeKey");
      }
    },
  });

  // Importera initial JSON-data om IndexedDB är tom
  const tx = db.transaction(STORE_NAME, 'readonly');
  const count = await tx.store.count();
  await tx.done;

  if (count === 0) {
    console.log("IndexedDB is empty, populating with initial data from JSON...");
    const addTx = db.transaction(STORE_NAME, 'readwrite');
    let newCount = 0;
    for (const phrase of phrasesData) {
      // Säkerställ att compositeKey finns för lokala data
       // Explicit type assertion if necessary
      const phraseWithKey = ensureCompositeKey(phrase as Omit<Phrase, 'compositeKey'>);
      await addTx.store.add(phraseWithKey);
      newCount++;
    }
    await addTx.done;
    console.log(`Added ${newCount} default phrases from JSON to IndexedDB.`);
  } else {
    console.log("IndexedDB already contains data, skipping initial JSON population.");
  }

  return db;
};

// --- Manuella Synkroniseringsfunktioner ---

/**
 * Hämtar alla fraser från Supabase och skriver över den lokala IndexedDB.
 * Anropas från knappen "Synka från Supabase".
 */
export const syncFromSupabase = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  console.log("Attempting to sync FROM Supabase...");
  if (!navigator.onLine) {
      const message = "Cannot sync from Supabase: No internet connection.";
      console.error(message);
      return { success: false, count: 0, error: message };
  }

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .select('*');

    if (error) {
      console.error("Error fetching from Supabase:", error);
      return { success: false, count: 0, error: error.message };
    }

    if (data) {
      console.log(`Fetched ${data.length} phrases from Supabase.`);
      const db = await initDatabase();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await tx.store.clear(); // Rensa lokal databas först
      let addedCount = 0;
      for (const supabasePhrase of data) {
         // Mappa Supabase-data till lokalt format och säkerställ compositeKey
         const localPhrase = ensureCompositeKey({
            created: supabasePhrase.created, // Antag att kolumnen heter 'created'
            original: supabasePhrase.original,
            translation: supabasePhrase.translation,
            category: supabasePhrase.category,
            favorite: supabasePhrase.favorite,
         });
        await tx.store.put(localPhrase); // Använd put för att infoga
        addedCount++;
      }
      await tx.done;
      console.log(`Successfully updated local DB with ${addedCount} phrases from Supabase.`);
      return { success: true, count: addedCount };
    } else {
        return { success: true, count: 0 }; // Inget data att hämta
    }
  } catch (err: any) {
    console.error("Unexpected error during sync from Supabase:", err);
    return { success: false, count: 0, error: err.message || "Unknown error" };
  }
};

/**
 * Skickar alla lokala fraser till Supabase (infogar nya, uppdaterar existerande).
 * Anropas från knappen "Synka till Supabase".
 */
export const syncToSupabase = async (): Promise<{ success: boolean; upsertedCount: number; error?: string }> => {
  console.log("Attempting to sync TO Supabase...");
   if (!navigator.onLine) {
      const message = "Cannot sync to Supabase: No internet connection.";
      console.error(message);
      return { success: false, upsertedCount: 0, error: message };
  }

  try {
    const db = await initDatabase();
    const localPhrases = await db.getAll(STORE_NAME);
    console.log(`Found ${localPhrases.length} local phrases to potentially sync.`);

    if (localPhrases.length === 0) {
        console.log("No local phrases to sync.");
        return { success: true, upsertedCount: 0 };
    }

    // Mappa lokala data till Supabase-format (ta bort compositeKey)
    const supabasePhrases = localPhrases.map(p => ({
        created: p.created, // Se till att detta är ett giltigt Supabase timestamp format
        original: p.original,
        translation: p.translation,
        category: p.category,
    }));

    // Använd upsert för att infoga/uppdatera baserat på primärnyckeln (original, translation)
    const { data, error, count } = await supabase
      .from(SUPABASE_TABLE)
      .upsert(supabasePhrases, {
         // Supabase använder primärnyckeln per automatik för upsert, ingen onConflict behövs här
         // om primärnyckeln är korrekt definierad i DB (vilket den är)
      })
      .select(); // select() för att returnera de påverkade raderna

    if (error) {
      console.error("Error upserting to Supabase:", error);
      return { success: false, upsertedCount: 0, error: error.message };
    }

    const upsertedCount = data?.length ?? count ?? 0; // Ta längden på returnerad data, eller count om data är null
    console.log(`Successfully upserted ${upsertedCount} phrases to Supabase.`);
    // Om count är null/undefined och data är tomt, kan det betyda att inga rader ändrades
    if (upsertedCount === 0 && localPhrases.length > 0){
        console.log("Note: Upsert completed, but no rows were reported as changed/added. Data might have been identical.");
    }

    return { success: true, upsertedCount: upsertedCount };

  } catch (err: any) {
    console.error("Unexpected error during sync to Supabase:", err);
     return { success: false, upsertedCount: 0, error: err.message || "Unknown error" };
  }
};


// --- Lokala CRUD-operationer (interagerar endast med IndexedDB) ---

/**
 * Hämtar fraser från IndexedDB.
 */
export const getPhrases = async (query?: string): Promise<Phrase[]> => {
  const db = await initDatabase();
  const allPhrases = await db.getAll(STORE_NAME);
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
 * Lägger till en fras i IndexedDB.
 */
export const addPhrase = async (phrase: Omit<Phrase, 'compositeKey'>): Promise<void> => {
  const db = await initDatabase();
  const phraseWithKey = ensureCompositeKey(phrase); // Skapa objekt för IndexedDB
  try {
    await db.add(STORE_NAME, phraseWithKey);
    console.log("Phrase added to local DB.");
  } catch (error: any) {
     console.error("Error adding phrase to local DB:", error);
      if (error.name !== 'ConstraintError') {
           throw error; // Kasta vidare andra fel
      } else {
          console.warn(`Phrase with key "${phraseWithKey.compositeKey}" already exists locally.`);
          // Överväg att uppdatera istället om det är önskat beteende
          // await updatePhrase(phraseWithKey);
      }
  }
};

/**
 * Uppdaterar en fras i IndexedDB.
 */
export const updatePhrase = async (phrase: Phrase): Promise<void> => {
  const db = await initDatabase();
  // Säkerställ composite key innan lagring
  const phraseWithKey = ensureCompositeKey(phrase);
  try {
      await db.put(STORE_NAME, phraseWithKey); // put uppdaterar eller infogar
      console.log("Phrase updated/put locally.");
  } catch(error) {
       console.error("Error updating/putting phrase locally:", error);
       throw error;
  }
};

/**
 * Tar bort en fras från IndexedDB baserat på dess compositeKey.
 */
export const removePhrase = async (phrase: Phrase): Promise<void> => {
  const db = await initDatabase();
  const key = phrase.compositeKey; // Använd befintlig compositeKey
   if (!key) {
      console.error("Cannot remove phrase, compositeKey is missing:", phrase);
      return;
   }
  try {
    await db.delete(STORE_NAME, key);
    console.log(`Phrase with key "${key}" removed locally.`);
  } catch(error) {
      console.error(`Error removing phrase with key "${key}" locally:`, error);
      throw error;
  }
};


// --- Övriga Funktioner (påverkar endast IndexedDB) ---

export const syncDefaultPhrases = async (): Promise<void> => {
  const db = await initDatabase();
  const existing = await db.getAll(STORE_NAME);
  const existingKeys = new Set(existing.map((p) => p.compositeKey));
  let newCount = 0;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const phrase of phrasesData) {
     // Explicit type assertion if necessary
    const phraseWithKey = ensureCompositeKey(phrase as Omit<Phrase, 'compositeKey'>);
    if (!existingKeys.has(phraseWithKey.compositeKey)) {
      await tx.store.add(phraseWithKey);
      newCount++;
    }
  }
  await tx.done;
  console.log(`Synced ${newCount} default phrases from JSON manually to local DB.`);
};


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

// Ta bort event listeners för online/offline - synk är nu manuell
// window.removeEventListener('online', syncLocalChangesToSupabase);