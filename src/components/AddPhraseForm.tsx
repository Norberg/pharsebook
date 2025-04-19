import React, { useState } from "react";
import { Phrase } from "../utils/phraseUtils";

interface AddPhraseFormProps {
  onAddPhrase: (phrase: Phrase) => void;
  categories: string[];
}

const AddPhraseForm: React.FC<AddPhraseFormProps> = ({ onAddPhrase, categories }) => {
  const [original, setOriginal] = useState("");
  const [translation, setTranslation] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (original && translation && category) {
      onAddPhrase({ original, translation, category, created: new Date().toISOString(), favorite: false });
      setOriginal("");
      setTranslation("");
      setCategory("");
    } else {
      alert("Please fill in all fields and select a category.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Original phrase"
        value={original}
        onChange={(e) => setOriginal(e.target.value)}
      />
      <input
        type="text"
        placeholder="Translation"
        value={translation}
        onChange={(e) => setTranslation(e.target.value)}
      />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Select category</option>
        {categories.map((cat, index) => (
          <option key={index} value={cat}>
            {cat}
          </option>
        ))}
      </select>
      <button type="submit">Add Phrase</button>
    </form>
  );
};

export default AddPhraseForm;