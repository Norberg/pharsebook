import React, { useState, useEffect } from "react";
import { Phrase } from "../utils/phraseUtils";
import { FaEdit } from "react-icons/fa";
import "./PhraseList.css";

interface PhraseListProps {
  phrases: Phrase[];
  categoryIcons: Record<string, JSX.Element>;
  onEdit?: (phrase: Phrase) => void;
  searchQuery?: string;
  expandAll?: boolean; // Add expandAll prop
}

const PhraseList: React.FC<PhraseListProps> = ({ phrases, categoryIcons, onEdit, searchQuery, expandAll = false }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const groupedPhrases = React.useMemo(() => {
    return phrases.reduce((acc, phrase) => {
      const category = phrase.category || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(phrase);
      return acc;
    }, {} as Record<string, Phrase[]>);
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

  return (
    <div className="phrase-list">
      {Object.entries(groupedPhrases).map(([category, phrases]) => (
        <div key={category} className="category-group">
          <h3 className="category-header" onClick={() => handleCategoryClick(category)}>
            {category} {categoryIcons[category]} ({phrases.length})
          </h3>
          {expandedCategories.has(category) && (
            <ul className="phrase-items">
              {phrases.map((phrase, index) => (
                <li key={index} className="phrase-item">
                  <span>
                    <strong>{phrase.original}</strong> - {phrase.translation}
                  </span>
                  {onEdit && (
                    <button onClick={() => onEdit(phrase)} className="edit-button">
                      <FaEdit />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default PhraseList;
