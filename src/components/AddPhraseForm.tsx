import React, { useState, useEffect } from "react";
import { Phrase, Category } from "../utils/phraseUtils";
import { useCategories } from "./categories";
import "./AddPhraseForm.css";

interface AddPhraseFormProps {
  onAddPhrase: (phrase: Phrase) => void;
  phraseToEdit?: Phrase;
  onEditPhrase?: (updatedPhrase: Phrase) => void;
  onCancel?: () => void;
  onDelete?: () => void;
}

const AddPhraseForm: React.FC<AddPhraseFormProps> = ({
  onAddPhrase,
  phraseToEdit,
  onEditPhrase,
  onCancel,
  onDelete,
}) => {
  const [original, setOriginal] = useState("");
  const [translation, setTranslation] = useState("");
  const dynamicCats = useCategories();
  const [category, setCategory] = useState<string>(
    phraseToEdit?.category ?? dynamicCats[0]?.name ?? ""
  );

  useEffect(() => {
    if (phraseToEdit) {
      setOriginal(phraseToEdit.original);
      setTranslation(phraseToEdit.translation);
      setCategory(phraseToEdit.category);
    } else {
      setOriginal("");
      setTranslation("");
      setCategory(dynamicCats[0]?.name ?? "");
    }
  }, [phraseToEdit, dynamicCats]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOriginal = original.trim();
    const trimmedTranslation = translation.trim();
    const newPhrase: Phrase = {
      original: trimmedOriginal,
      translation: trimmedTranslation,
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
    setCategory(dynamicCats[0]?.name ?? "");
  };

  const handleDelete = () => {
    if (window.confirm("Är du säker på att du vill radera denna fras?")) {
      onDelete && onDelete();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text/plain");
    if (pasted.includes("\n")) {
      e.preventDefault();
      const [first, ...rest] = pasted.split(/\r?\n/);
      setOriginal(first.trim());
      setTranslation(rest.map(line => line.trim()).join(" "));
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
          onBlur={() => setOriginal(original.trim())}
          onPaste={handlePaste}
          className="inputField"
        />
      </div>
      <div className="inputRow">
        <input
          type="text"
          placeholder="Översättning"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          onBlur={() => setTranslation(translation.trim())}
          className="inputField"
        />
      </div>
      <div className="inputRow">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="inputField"
        >
          {dynamicCats.map((cat: Category) => (
            <option key={cat.name} value={cat.name}>
              {cat.name}
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