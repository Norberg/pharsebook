import React from "react";

const ItalianNumbers: React.FC = () => {
  const entries: [string, string][] = [
    ["0", "zero"],
    ["1", "uno"],
    ["2", "due"],
    ["3", "tre"],
    ["4", "quattro"],
    ["5", "cinque"],
    ["6", "sei"],
    ["7", "sette"],
    ["8", "otto"],
    ["9", "nove"],
    ["10", "dieci"],
    ["11", "undici"],
    ["12", "dodici"],
    ["13", "tredici"],
    ["14", "quattordici"],
    ["15", "quindici"],
    ["16", "sedici"],
    ["17", "diciassette"],
    ["18", "diciotto"],
    ["19", "diciannove"],
    ["20", "venti"],
    ["21", "ventuno"],
    ["22", "ventidue"],
    ["23", "ventitre"],
    ["28", "ventotto"],
    ["30", "trenta"],
    ["40", "quaranta"],
    ["50", "cinquanta"],
    ["60", "sessanta"],
    ["70", "settanta"],
    ["80", "ottanta"],
    ["90", "novanta"],
    ["100", "cento"],
    ["1000", "mille"],
    ["1000000", "un milione"],
  ];

  return (
    <ul className="numbers-list">
      {entries.map(([num, name]) => (
        <li key={num}>
          {num} – {name}
        </li>
      ))}
    </ul>
  );
};

export default ItalianNumbers;
