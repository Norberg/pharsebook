import React, { useState, useEffect } from "react";
import "./CategoryManager.css";
import ReactDOM from "react-dom";
import {
  getCategories,
  addCategory,
  updateCategory,
  removeCategory,
  Phrase,
  getPhrases,
} from "../utils/phraseUtils";

interface Props { onClose: () => void; }

const CategoryManager: React.FC<Props> = ({ onClose }) => {
  const [cats, setCats] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [phrases, setPhrases] = useState<Phrase[]>([]);

  useEffect(() => {
    (async () => {
      setCats(await getCategories());
      setPhrases(await getPhrases());
    })();
  }, []);

  const reload = async () => {
    setCats(await getCategories());
    setPhrases(await getPhrases());
  };

  const handleAdd = async () => {
    if (!newName) return;
    await addCategory({ name: newName, icon: newIcon || "🏷️", position: cats.length + 1 });
    setNewName(""); setNewIcon("");
    await reload();
  };

  const handleRename = async (idx: number, name: string) => {
    const cat = cats[idx];
    if (phrases.some(p => p.category === cat.name)) {
      alert("Kategorin används");
      return;
    }
    await updateCategory({ ...cat, name });
    await reload();
  };

  const handleDelete = async (idx: number) => {
    const cat = cats[idx];
    if (phrases.some(p => p.category === cat.name)) {
      alert("Kategorin används");
      return;
    }
    await removeCategory(cat.name);
    await reload();
  };

  const move = async (i: number, delta: number) => {
    const a = [...cats];
    const j = i + delta;
    if (j < 0 || j >= a.length) return;
    [a[i].position, a[j].position] = [a[j].position, a[i].position];
    await Promise.all(a.map(updateCategory));
    setCats(a.sort((x, y) => x.position - y.position));
  };

  return ReactDOM.createPortal(
    <>
      <div className="catmgr-overlay" onClick={onClose} />
      <div className="catmgr-modal">
        <h3>Hantera kategorier</h3>
        <ul>
          {cats.map((c, i) => (
            <li key={c.name}>
              {/* name is now read‑only */}
              <span className="catmgr-name">{c.name}</span>
              {/* editable icon, max 3 chars */}
              <input
                type="text"
                defaultValue={c.icon}
                maxLength={3}
                className="catmgr-icon-input"
                onBlur={e => {
                  const newIcon = e.target.value || "🏷️";
                  updateCategory({ ...c, icon: newIcon });
                }}
              />
              <button onClick={() => move(i, -1)}>↑</button>
              <button onClick={() => move(i, +1)}>↓</button>
              <button className="catmgr-delete-button" onClick={() => handleDelete(i)}>X</button>
            </li>
          ))}
        </ul>
        <div>
          <input
            placeholder="Ny kategori"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
          <input
            placeholder="Emoji"
            value={newIcon}
            maxLength={3}
            className="catmgr-icon-input"
            onChange={e => setNewIcon(e.target.value)}
          />
          <button onClick={handleAdd}>Lägg till</button>
        </div>
        <div className="actions">
          <button onClick={onClose}>Stäng</button>
        </div>
      </div>
    </>,
    document.body
  );
};

export default CategoryManager;
