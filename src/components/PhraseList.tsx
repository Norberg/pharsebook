import React, { useState, useEffect, JSX } from "react";
import { Phrase } from "../utils/phraseUtils";
import { FaEdit, FaVolumeUp } from "react-icons/fa"; // lägg till ikon
import { useCategories } from "./categories";
import { initializeSpeech, speakText } from "../utils/speechUtils"; // import speechUtils
import "./PhraseList.css";
import ItalianNumbers from "./Numbers";

interface PhraseListProps {
  phrases: Phrase[];
  categoryIcons: Record<string, JSX.Element>;
  onEdit?: (phrase: Phrase) => void;
  searchQuery?: string;
  expandAll?: boolean; // Add expandAll prop
}

const PhraseList: React.FC<PhraseListProps> = ({ phrases, categoryIcons, onEdit, searchQuery, expandAll = false }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const dynamicCats = useCategories();

  const groupedPhrases = React.useMemo(() => {
    const grouped = phrases.reduce((acc, phrase) => {
      const category = phrase.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(phrase);
      return acc;
    }, {} as Record<string, Phrase[]>);

    // Sortera varje kategori efter created, senaste först
    Object.keys(grouped).forEach((cat) => {
      grouped[cat].sort((a, b) =>
        new Date(b.created ?? 0).getTime() - new Date(a.created ?? 0).getTime()
      );
    });

    return grouped;
  }, [phrases]);

  useEffect(() => {
    if (expandAll) {
      // Expand all categories when expandAll is true
      setExpandedCategories(new Set(Object.keys(groupedPhrases)));
    } else if (!searchQuery?.trim()) {
      // Collapse all categories when no search query and expandAll is false
      setExpandedCategories(new Set());
    }
  }, [expandAll, groupedPhrases, searchQuery]);

  const handleCategoryClick = (category: string) => {
    if (expandAll) return; // Prevent manual collapsing when expandAll is true
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Ny funktion för att initiera och spela upp text
  const handlePlay = async (text: string) => {
    const ready = await initializeSpeech();
    if (ready) {
      speakText(text);
    }
  };

  const ordered = dynamicCats
    .map((c) => c.name)
    .filter((name) => groupedPhrases[name]);
  const extra = Object.keys(groupedPhrases).filter(
    (name) => !dynamicCats.some((c) => c.name === name)
  );
  const renderCategories = [...ordered, ...extra];

  return (
    <div className="phrase-list">
      {renderCategories.map((category) => (
        <div key={category} className="category-group">
          <h3 className="category-header" onClick={() => handleCategoryClick(category)}>
            {category} {categoryIcons[category]} ({groupedPhrases[category].length})
          </h3>
          {expandedCategories.has(category) && (
            <>
              {category === "Nummer" && <ItalianNumbers />}
              <ul className="phrase-items">
                {groupedPhrases[category].map((phrase, idx) => (
                  <li key={idx} className="phrase-item">
                    <span>
                      <strong>{phrase.original}</strong> - {phrase.translation}
                    </span>
                    <div>
                      <button
                        onClick={() => handlePlay(phrase.translation)}
                        className="play-button"
                      >
                        <FaVolumeUp />
                      </button>
                      {onEdit && (
                        <button onClick={() => onEdit(phrase)} className="edit-button">
                          <FaEdit />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default PhraseList;
