import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import "./Settings.css";
import {
  syncWithSupabase,
  mergeWithSupabase,
  applyLocalOnly,
  applySupabaseOnly,
  SyncDiff,
} from "../utils/phraseUtils";
import { supabase } from "../utils/supabaseClient"; // Importera klient (se nästa fil)
import CategoryManager from "./CategoryManager";

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
  const [showCatMgr, setShowCatMgr] = useState(false);
  const [syncDiff, setSyncDiff] = useState<SyncDiff | null>(null);
  const [showSyncOptions, setShowSyncOptions] = useState(false);
  const [syncChoice, setSyncChoice] = useState<"merge" | "local" | "supabase" | null>(null);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);

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

  const handleSyncClick = async () => {
    setSyncLoading(true);
    const diff = await syncWithSupabase();
    setSyncLoading(false);
    if (diff.same) {
      alert("Allt är samma både lokalt och på Supabase.");
    } else {
      setSyncDiff(diff);
      setShowSyncOptions(true);
    }
  };

  const confirmSync = async () => {
    setShowSyncConfirm(false);
    setShowSyncOptions(false);
    setSyncLoading(true);
    if (syncChoice === "merge") await mergeWithSupabase();
    if (syncChoice === "local") await applyLocalOnly();
    if (syncChoice === "supabase") await applySupabaseOnly();
    setSyncLoading(false);
    onSync();                          // ← ny rad: refresha i‑minnet‑lista
    alert("Synkronisering klar.");
  };

  const cancelSync = () => {
    setShowSyncOptions(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthMsg("");
    const emailRedirectTo =
      window.location.origin +
      (window.location.pathname.endsWith("/")
        ? window.location.pathname
        : window.location.pathname + "/");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
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
              onChange={(e) => setEmail(e.target.value)}
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
          <button onClick={handleSyncClick} disabled={syncLoading}>
            {syncLoading ? "Laddar..." : "Synka med Supabase"}
          </button>
        )}
        <button
          onClick={() => {
            console.log("Hantera kategorier clicked");
            setShowCatMgr(true);
          }}
        >
          Hantera kategorier
        </button>
      </div>
      {showCatMgr && <CategoryManager onClose={() => setShowCatMgr(false)} />}
      {showSyncOptions && syncDiff && (
        <div className="sync-dialog">
          <p>
            Nya lokala: {syncDiff.localOnly.length}, nya på Supabase: {syncDiff.supabaseOnly.length}, ändrade: {syncDiff.changed.length}
          </p>
          <ul>
            {syncDiff.localOnly.slice(0, 10).map((p, i) => (
              <li key={`local-${i}`}>
               <b>(Lokal)</b> {p.original} – {p.translation} 
              </li>
            ))}
            {syncDiff.supabaseOnly.slice(0, 10).map((p, i) => (
              <li key={`supa-${i}`}>
                <b>(Supabase)</b> {p.original} – {p.translation}
              </li>
            ))}
            {syncDiff.changed.slice(0, 10).map(({ local, supabase }, i) => (
              <li key={`changed-${i}`}>
                <b>(Ändrad)</b> {local.original} – {local.translation}: kategori  <b>(Lokal)</b> "{local.category}", <b>(Supabase)</b> "{supabase.category}"
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              setSyncChoice("merge");
              setShowSyncConfirm(true);
            }}
          >
            Slåihop
          </button>
          <button
            onClick={() => {
              setSyncChoice("local");
              setShowSyncConfirm(true);
            }}
          >
            Välj lokala
          </button>
          <button
            onClick={() => {
              setSyncChoice("supabase");
              setShowSyncConfirm(true);
            }}
          >
            Välj Supabase
          </button>
          <button onClick={cancelSync}>Avbryt</button>
        </div>
      )}
      {showSyncConfirm && (
        <div className="confirmation-dialog">
          <p>Är du säker att du vill fortsätta?</p>
          <button onClick={confirmSync}>Ja</button>
          <button onClick={() => setShowSyncConfirm(false)}>Nej</button>
        </div>
      )}
      {showConfirmation && (
        <div className="confirmation-dialog">
          <p>Är du säker på att du vill skriva över och tabort {phraseCount} fraser?</p>
          <button onClick={confirmOverwrite}>Ja</button>
          <button onClick={cancelOverwrite}>Nej</button>
        </div>
      )}
      <footer className="build-info">
        Phrasebook - build date:{" "}
        {new Date(__BUILD_DATE__).toLocaleString(undefined, {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </footer>
    </div>
  );
};

export default Settings;
