import React from "react";
import { FaVolumeUp } from "react-icons/fa";

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

  // State for the input field (digits only)
  const [input, setInput] = React.useState("");
  // State for the result (Italian number text and currency or null)
  const [result, setResult] = React.useState<{text: string, currency?: string} | null>(null);


  // Create a map for fast lookup of numbers that have a direct translation in the list
  const numMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    entries.forEach(([num, name]) => {
      map[num] = name;
    });
    return map;
  }, [entries]);

  /**
   * Converts a number (0 - 1,000,000) or a number with up to 2 decimals to its Italian text representation.
   * Handles all rules for Italian numbers, including decimals (e.g. 12,34 => dodici virgola trentaquattro)
   * @param value The number or string to convert
   * @returns The Italian text for the number, or "Okänt tal" if out of range
   */
  function toItalianWithDecimals(value: string): {text: string, currency?: string} {
    if (!value) return { text: "" };
    // Split integer and decimal part
    const [intPart, decPart] = value.split(/[,\.]/);
    const intNum = parseInt(intPart, 10);
    if (isNaN(intNum)) return { text: "Okänt tal" };
    let result = toItalian(intNum);
    let currency = undefined;
    if (decPart && decPart.length > 0) {
      // Only support up to 2 decimals
      const dec = decPart.slice(0, 2).padEnd(2, '0');
      // Remove leading zeros for pronunciation
      const decNum = parseInt(dec, 10);
      result += " virgola " + toItalian(decNum);
      // Currency string for Italian (euro and centesimi), using text for numbers
      const euro = intNum === 1 ? "euro" : "euro";
      const cent = decNum === 1 ? "centesimo" : "centesimi";
      currency = `${toItalian(intNum)} ${euro}`;
      if (decNum > 0) {
        currency = `${toItalian(intNum)} ${euro} e ${toItalian(decNum)} ${cent}`;
      }
    }
    return { text: result, currency };
  }

  // Old function for integer numbers only
  function toItalian(num: number): string {
    if (numMap[String(num)]) return numMap[String(num)];
    if (num < 0 || num > 1000000) return "Okänt tal";
    if (num < 20) return numMap[String(num)] || "";
    if (num < 100) {
      const tens = Math.floor(num / 10) * 10;
      const ones = num % 10;
      let base = numMap[String(tens)] || "";
      if (ones === 1 || ones === 8) base = base.slice(0, -1);
      return base + (ones ? toItalian(ones) : "");
    }
    if (num < 200) {
      let rest = num % 100;
      let base = "cento";
      if (Math.floor(rest / 10) === 8) base = "cent";
      return base + (rest ? toItalian(rest) : "");
    }
    if (num < 1000) {
      const hundreds = Math.floor(num / 100);
      let rest = num % 100;
      let base = toItalian(hundreds) + "cento";
      if (Math.floor(rest / 10) === 8) base = toItalian(hundreds) + "cent";
      return base + (rest ? toItalian(rest) : "");
    }
    if (num < 2000) {
      let rest = num % 1000;
      return "mille" + (rest ? toItalian(rest) : "");
    }
    if (num < 1000000) {
      const thousands = Math.floor(num / 1000);
      let rest = num % 1000;
      return toItalian(thousands) + "mila" + (rest ? toItalian(rest) : "");
    }
    if (num === 1000000) return "un milione";
    return "Okänt tal";
  }

  /**
   * Handles changes in the input field. Allows digits and up to one comma or dot for decimals.
   * Updates the result immediately as the user types.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits and at most one comma or dot
    let val = e.target.value.replace(/[^0-9.,]/g, "");
    // Only allow one comma or dot
    val = val.replace(/([.,]).*\1/, '$1');
    // Limit to 2 decimals if present
    val = val.replace(/([.,])(\d{0,2})\d*$/, (m, sep, dec) => sep + dec);
    setInput(val);
    if (val) {
      setResult(toItalianWithDecimals(val));
    } else {
      setResult(null);
    }
  };

  return (
    <>
      <ul className="numbers-list">
        {entries.map(([num, name]) => (
          <li key={num}>
            <strong>{num}</strong> – {name}
            <button
              className="play-button"
              title={`Spela upp ${name}`}
              onClick={async () => {
                const mod = await import('../utils/speechUtils');
                const ready = await mod.initializeSpeech();
                if (ready) mod.speakText(name, 'it-IT');
              }}
            >
              <FaVolumeUp style={{ fontSize: 18, color: '#333' }} />
            </button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: "1em" }}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={input}
          onChange={handleInputChange}
          placeholder="Skriv ett tal..."
        />
      </div>
      {result && (
        <div style={{ marginTop: "0.5em" }}>
          <strong>Tal:</strong> {result.text}
          <button
            className="play-button"
            title="Spela upp talet"
            onClick={async () => {
              const mod = await import('../utils/speechUtils');
              const ready = await mod.initializeSpeech();
              if (ready) mod.speakText(result.text, 'it-IT');
            }}
          >
            <FaVolumeUp style={{ fontSize: 18, color: '#333' }} />
          </button>
          {result.currency && (
            <div style={{ marginTop: 4 }}>
              <strong>Valuta:</strong> {result.currency}
              <button
                className="play-button"
                style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', padding: 0 }}
                title="Spela upp valutatext"
                onClick={async () => {
                  const mod = await import('../utils/speechUtils');
                  const ready = await mod.initializeSpeech();
                  if (ready) mod.speakText(result.currency!, 'it-IT');
                }}
              >
                <FaVolumeUp style={{ fontSize: 18, color: '#333' }} />
              </button>
            </div>
          )}

        </div>
      )}
    </>
  );
};

export default ItalianNumbers;
