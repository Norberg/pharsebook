import React, { useState } from "react";
import { Phrase } from "../utils/phraseUtils";

interface AddPhraseFormProps {
  onAddPhrase: (phrase: Phrase) => void;
}

const AddPhraseForm: React.FC<AddPhraseFormProps> = ({ onAddPhrase }) => {
  const [original, setOriginal] = useState("");
  const [translation, setTranslation] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (original && translation) {
      onAddPhrase({ original, translation });
      setOriginal("");
      setTranslation("");
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
      <button type="submit">Add Phrase</button>
    </form>
  );
};

export default AddPhraseForm;
