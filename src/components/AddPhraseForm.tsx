import React, { useState } from "react";
import { Phrase } from "../utils/phraseUtils";
import "./AddPhraseForm.css";

interface AddPhraseFormProps {
  onAddPhrase: (phrase: Phrase) => void;
  categories: string[];
}

const AddPhraseForm: React.FC<AddPhraseFormProps> = ({ onAddPhrase, categories }) => {
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
    } else {
      alert("Vänligen fyll i alla fält och välj en kategori.");
    }
  };

  const handleCancel = () => {
    setOriginal("");
    setTranslation("");
    setCategory("");
    setShowForm(false);
  };

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)}>
        Lägg till fras
      </button>
    );
  }

  return (
    <div className="formContainer">
      <div className="heading">Fras:</div>
      <form onSubmit={handleSubmit}>
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
            <option value="">Välj kategori</option>
            {categories.map((cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="buttonGroup">
          <button type="submit">Lägg till</button>
          <button type="button" onClick={handleCancel}>
            Avbryt
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddPhraseForm;