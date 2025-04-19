import React from "react";
import { Phrase } from "../utils/phraseUtils";

interface PhraseListProps {
  phrases: Phrase[];
}

const PhraseList: React.FC<PhraseListProps> = ({ phrases }) => {
  return (
    <ul>
      {phrases.map((phrase, index) => (
        <li key={index}>
          <strong>{phrase.original}</strong> - {phrase.translation}
        </li>
      ))}
    </ul>
  );
};

export default PhraseList;
