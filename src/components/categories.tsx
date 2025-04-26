import React, { useState, useEffect } from "react";
import categoriesJson from "../data/categories.json";
import { getCategories, Category } from "../utils/phraseUtils";

// Hook för att läsa in kategorier från IndexedDB
export const useCategories = (): Category[] => {
  const [cats, setCats] = useState<Category[]>([]);
  useEffect(() => {
    (async () => {
      const loaded = await getCategories();
      setCats(loaded);
    })();
  }, []);
  return cats;
};

// Returnerar emoji-ikon för en kategori; fallback till JSON-data
export const getCategoryIcon = (
  name: string,
  dynamicList?: Category[]
): JSX.Element => {
  const list = dynamicList ?? (categoriesJson as Category[]);
  const cat = list.find(c => c.name === name);
  return (
    <span className="emoji" role="img" aria-label={name}>
      {cat?.icon ?? "🏷️"}
    </span>
  );
};