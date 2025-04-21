import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import "./Settings.css";

interface SettingsProps {
  onBack: () => void;
  onExport: () => void;
  onSync: () => void;
  onOverwrite: () => Promise<{ removedCount: number; addedCount: number }>; // Updated prop
}

const Settings: React.FC<SettingsProps> = ({ onBack, onExport, onSync, onOverwrite }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [phraseCount, setPhraseCount] = useState(0);

  const handleOverwriteClick = async () => {
    const { removedCount } = await onOverwrite();
    setPhraseCount(removedCount);
    setShowConfirmation(true);
  };

  const confirmOverwrite = () => {
    setShowConfirmation(false);
  };

  const cancelOverwrite = () => {
    setShowConfirmation(false);
  };

  return (
    <div className="settings-page">
      <button onClick={onBack} className="back-button">
        <FaArrowLeft /> Tillbaka
      </button>
      <h2>Inställningar</h2>
      <div className="settings-buttons">
        <button onClick={onExport}>Exportera fraser</button>
        <button onClick={onSync}>Synka fraser</button>
        <button onClick={handleOverwriteClick}>Skriv över lokala fraser</button>
      </div>
      {showConfirmation && (
        <div className="confirmation-dialog">
          <p>
            Är du säker på att du vill skriva över och tabort {phraseCount} fraser?
          </p>
          <button onClick={confirmOverwrite}>Ja</button>
          <button onClick={cancelOverwrite}>Nej</button>
        </div>
      )}
      <footer className="build-info">
        Phrasebook - build date: {new Date(__BUILD_DATE__).toLocaleString(undefined, {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </footer>
    </div>
  );
};

export default Settings;
