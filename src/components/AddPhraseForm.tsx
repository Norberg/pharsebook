import React, { useState, useEffect } from "react";
import { Phrase } from "../utils/phraseUtils";
import "./AddPhraseForm.css";

interface AddPhraseFormProps {
  onAddPhrase: (phrase: Phrase) => void;
  categories: string[];
  phraseToEdit?: Phrase;
  onEditPhrase?: (updatedPhrase: Phrase) => void;
  onCancel?: () => void;
  onDelete?: () => void; // ny prop
}

const AddPhraseForm: React.FC<AddPhraseFormProps> = ({
  onAddPhrase,
  categories,
  phraseToEdit,
  onEditPhrase,
  onCancel,
  onDelete, // ny prop
}) => {
  const [original, setOriginal] = useState("");
  const [translation, setTranslation] = useState("");
  const [category, setCategory] = useState(categories[0]);

  useEffect(() => {
    if (phraseToEdit) {
      console.log("Editing mode activated with phrase:", phraseToEdit); // Logga redigeringsläget
      setOriginal(phraseToEdit.original);
      setTranslation(phraseToEdit.translation);
      setCategory(phraseToEdit.category);
    } else {
      setOriginal("");
      setTranslation("");
      setCategory(categories[0]);
    }
  }, [phraseToEdit, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPhrase: Phrase = {
      original,
      translation,
      category,
      created: new Date().toISOString(),
      favorite: phraseToEdit ? phraseToEdit.favorite : false,
    };
    if (phraseToEdit && onEditPhrase) {
      onEditPhrase(newPhrase);
    } else {
      onAddPhrase(newPhrase);
    }
    setOriginal("");
    setTranslation("");
    setCategory(categories[0]);
  };

  const handleDelete = () => {
    if (window.confirm("Är du säker på att du vill radera denna fras?")) {
      onDelete && onDelete();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="formContainer">
      <h2>{phraseToEdit ? "Redigera Fras" : "Lägg till Fras"}</h2>
      <div className="inputRow">
        <input
          type="text"
          placeholder="Original"
          value={original}
          onChange={(e) => setOriginal(e.target.value)}
          className="inputField"
        />
      </div>
      <div className="inputRow">
        <input
          type="text"
          placeholder="Översättning"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          className="inputField"
        />
      </div>
      <div className="inputRow">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="inputField"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="buttonGroup">
        <button type="submit">{phraseToEdit ? "Uppdatera Fras" : "Lägg till Fras"}</button>
        {phraseToEdit && onDelete && (
          <button type="button" onClick={handleDelete}>
            Radera Fras
          </button>
        )}
        {phraseToEdit && onCancel && (
          <button type="button" onClick={onCancel}>
            Avbryt
          </button>
        )}
      </div>
    </form>
  );
};

export default AddPhraseForm;