import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import "./Settings.css";
import { syncFromSupabase, syncToSupabase } from "../utils/phraseUtils";
import { supabase } from "../utils/supabaseClient"; // Importera klient (se nästa fil)

interface SettingsProps {
  onBack: () => void;
  onExport: () => Promise<string>;
  onSync: () => void;
  onOverwrite: () => Promise<{ removedCount: number; addedCount: number }>;
}

const Settings: React.FC<SettingsProps> = ({
  onBack,
  onExport,
  onSync,
  onOverwrite,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [phraseCount, setPhraseCount] = useState(0);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<any>(null);
  const [authMsg, setAuthMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Hämta användare vid mount och på auth change
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleOverwriteClick = async () => {
    const { removedCount } = await onOverwrite();
    setPhraseCount(removedCount);
    setShowConfirmation(true);
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

  const handleSyncFromSupabase = async () => {
    const result = await syncFromSupabase();
    if (result.success) {
      alert(`Synkade ${result.count} fraser från Supabase!`);
    } else {
      alert(`Fel vid synk från Supabase: ${result.error}`);
    }
  };

  const handleSyncToSupabase = async () => {
    const result = await syncToSupabase();
    if (result.success) {
      alert(`Synkade ${result.upsertedCount} fraser till Supabase!`);
    } else {
      alert(`Fel vid synk till Supabase: ${result.error}`);
    }
  };

  // Magic link login/signup
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthMsg("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setAuthMsg(error.message);
    } else {
      setAuthMsg("Check your email for the magic link!");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="settings-page">
      <button onClick={onBack} className="back-button">
        <FaArrowLeft /> Tillbaka
      </button>
      <h2>Inställningar</h2>
      {!user ? (
        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            Logga in / skapa konto med e-post:
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </label>
          <button type="submit" disabled={loading || !email}>
            {loading ? "Skickar länk..." : "Skicka magic link"}
          </button>
          {authMsg && <div className="auth-msg">{authMsg}</div>}
        </form>
      ) : (
        <div className="user-info">
          <span>Inloggad som: {user.email}</span>
          <button onClick={handleLogout}>Logga ut</button>
        </div>
      )}
      <div className="settings-buttons">
        <button onClick={handleExportClick}>Exportera fraser</button>
        <button onClick={onSync}>Uppdatera nya fraser från grundutbudet</button>
        <button onClick={handleOverwriteClick}>Ersätt alla lokala fraser med grundutbudet</button>
        {user && (
          <>
            <button onClick={handleSyncFromSupabase}>Synka från Supabase</button>
            <button onClick={handleSyncToSupabase}>Synka till Supabase</button>
          </>
        )}
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
