import {JSX} from "react";
import categoriesJson from "../data/categories.json";
import { Category } from "../utils/phraseUtils";
import { usePhrasebook } from "../context/PhrasebookContext";

// useCategories now uses categories from PhrasebookContext for reactivity and single source of truth
export const useCategories = (): Category[] => {
  const { categories } = usePhrasebook();
  return categories;
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