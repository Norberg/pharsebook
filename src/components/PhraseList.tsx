import React from "react";
import { Phrase } from "../utils/phraseUtils";

interface PhraseListProps {
  phrases: Phrase[];
  categoryIcons: Record<string, JSX.Element>;
}

const PhraseList: React.FC<PhraseListProps> = ({ phrases, categoryIcons }) => {
  const groupedPhrases = phrases.reduce((acc, phrase) => {
    const category = phrase.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(phrase);
    return acc;
  }, {} as Record<string, Phrase[]>);

  return (
    <div className="phrase-list">
      {Object.entries(groupedPhrases).map(([category, phrases]) => (
        <div key={category} className="category-group">
          <h3 className="category-header">
          {category} {categoryIcons[category]} 
          </h3>
          <ul className="phrase-items">
            {phrases.map((phrase, index) => (
              <li key={index} className="phrase-item">
                <strong>{phrase.original}</strong> - {phrase.translation}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default PhraseList;
