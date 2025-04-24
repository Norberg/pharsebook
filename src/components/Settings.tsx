import React, { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";
import "./Settings.css";

// File server base URL as a constant
const FILE_SERVER_URL = "http://192.168.1.224:8075/save";

interface SettingsProps {
  onBack: () => void;
  onExport: () => Promise<string>;
  onSync: () => void;
  onOverwrite: () => Promise<{ removedCount: number; addedCount: number }>;
}

const Settings: React.FC<SettingsProps> = ({ onBack, onExport, onSync, onOverwrite }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [phraseCount, setPhraseCount] = useState(0);

  const handleOverwriteClick = async () => {
    const { removedCount } = await onOverwrite();
    setPhraseCount(removedCount);
    setShowConfirmation(true);
  };

  const handleUploadToFileServer = async () => {
    try {
      const exportedData = await onExport();
      const file = new Blob([exportedData], { type: "application/json" });
      const formData = new FormData();
      formData.append("file", file, "phrases.json");

      const response = await axios.post(FILE_SERVER_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert(`File uploaded successfully: ${response.data}`);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file to the server.");
    }
  };

  const handleExportClick = async () => {
    try {
      const exportedData = await onExport();
      const blob = new Blob([exportedData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "phrases.json";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting file:", error);
      alert("Failed to export phrases.");
    }
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
        <button onClick={handleExportClick}>Exportera fraser</button>
        <button onClick={onSync}>Synka fraser</button>
        <button onClick={handleOverwriteClick}>Skriv över lokala fraser</button>
        <button onClick={handleUploadToFileServer}>Ladda upp fraser till filserver</button>
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
