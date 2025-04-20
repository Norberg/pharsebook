import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import "./Settings.css";

interface SettingsProps {
  onBack: () => void;
  onExport: () => void;
  onSync: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onExport, onSync }) => {
  return (
    <div className="settings-page">
      <button onClick={onBack} className="back-button">
        <FaArrowLeft /> Tillbaka
      </button>
      <h2>Inställningar</h2>
      <div className="settings-buttons">
        <button onClick={onExport}>Exportera fraser</button>
        <button onClick={onSync}>Synka fraser</button>
      </div>
    </div>
  );
};

export default Settings;
