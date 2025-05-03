import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import "./Settings.css";
import { supabase } from "../utils/supabaseClient"; // Importera klient (se nästa fil)
import CategoryManager from "./CategoryManager";
import { usePhrasebook } from "../context/PhrasebookContext";

interface SettingsProps {
  onBack: () => void;
  onExport: () => Promise<string>;
  onSync: () => void;
  onOverwrite: () => Promise<{ removedCount: number; addedCount: number }>;
}

enum ConfirmationType {
  All = "all",
  Local = "local",
  Supabase = "supabase"
}

const Settings: React.FC<SettingsProps> = ({
  onBack,
  onExport,
  onSync,
  onOverwrite,
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState<ConfirmationType | null>(null);
  const [phraseCount, setPhraseCount] = useState(0);
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<any>(null);
  const [authMsg, setAuthMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCatMgr, setShowCatMgr] = useState(false);

  const {
    refreshPhrases,
    refreshCategories,
    syncWithSupabase,
    mergeWithSupabase,
    applyLocalOnly,
    applySupabaseOnly,
  } = usePhrasebook();

  // State for diff modal
  const [diffResult, setDiffResult] = useState<any | null>(null);
  const [showDiff, setShowDiff] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);

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
    setConfirmationType(ConfirmationType.All);
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

  // Bekräfta åtgärd beroende på typ
  const confirmOverwrite = async () => {
    setShowConfirmation(false);
    if (confirmationType === ConfirmationType.Local) {
      await applyLocalOnly();
      alert("Local data applied to Supabase.");
      refreshPhrases();
      refreshCategories();
    } else if (confirmationType === ConfirmationType.Supabase) {
      await applySupabaseOnly();
      alert("Supabase data applied locally.");
      refreshPhrases();
      refreshCategories();
    } // ConfirmationType.All hanteras redan i handleOverwriteClick
    setConfirmationType(null);
  };

  const cancelOverwrite = () => {
    setShowConfirmation(false);
    setConfirmationType(null);
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

  // Helper function to render a structured diff view
  function renderDiff(diffResult: any) {
    if (!diffResult) return null;
    const { localOnly = [], supabaseOnly = [], changed = [] } = diffResult;
    return (
      <div>
        {/* Local only section */}
        <h4>Local only</h4>
        {localOnly.length === 0 ? <div>None</div> : (
          <ul>
            {localOnly.map((p: any, i: number) => (
              <li key={i}>
                <strong>{p.original}</strong> - {p.translation} <em>({p.category})</em>
              </li>
            ))}
          </ul>
        )}
        {/* Supabase only section */}
        <h4>Supabase only</h4>
        {supabaseOnly.length === 0 ? <div>None</div> : (
          <ul>
            {supabaseOnly.map((p: any, i: number) => (
              <li key={i}>
                <strong>{p.original}</strong> - {p.translation} <em>({p.category})</em>
              </li>
            ))}
          </ul>
        )}
        {/* Changed section */}
        <h4>Changed</h4>
        {changed.length === 0 ? <div>None</div> : (
          <ul>
            {changed.map((pair: any, i: number) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <strong>Local:</strong><br />
                    <span>{pair.local.original} - {pair.local.translation} <em>({pair.local.category})</em></span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <strong>Supabase:</strong><br />
                    <span>{pair.supabase.original} - {pair.supabase.translation} <em>({pair.supabase.category})</em></span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Handler to show diff between local and Supabase
  const handleShowDiff = async () => {
    const diff = await syncWithSupabase();
    setDiffResult(diff);
    setShowDiff(true);
  };

  // Handler to merge local and Supabase
  const handleMerge = async () => {
    setMergeLoading(true);
    await mergeWithSupabase();
    setMergeLoading(false);
    alert("Merge complete. Data is now synchronized.");
    refreshPhrases();
    refreshCategories();
  };

  // Handler to apply local only (visa bekräftelse först)
  const handleApplyLocalOnly = () => {
    setConfirmationType(ConfirmationType.Local);
    setShowConfirmation(true);
  };

  // Handler to apply Supabase only (visa bekräftelse först)
  const handleApplySupabaseOnly = () => {
    setConfirmationType(ConfirmationType.Supabase);
    setShowConfirmation(true);
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
      {/* Flytta dialogen så den visas ovanför allt */}
      {showConfirmation && (
        <div className="confirmation-dialog">
          <p className="confirmation-dialog-text">
            {confirmationType === ConfirmationType.All && (
              <>Är du säker på att du vill skriva över och ta bort {phraseCount} fraser?</>
            )}
            {confirmationType === ConfirmationType.Local && (
              <>Är du säker på att du vill skriva över Supabase med lokala data?</>
            )}
            {confirmationType === ConfirmationType.Supabase && (
              <>Är du säker på att du vill skriva över lokala data med Supabase?</>
            )}
          </p>
          <div className="confirmation-dialog-buttons">
            <button onClick={confirmOverwrite}>Ja</button>
            <button onClick={cancelOverwrite}>Nej</button>
          </div>
        </div>
      )}
      <div className="settings-buttons">
        <button onClick={handleExportClick}>Exportera fraser</button>
        <button onClick={onSync}>Uppdatera nya fraser från grundutbudet</button>
        <button onClick={handleOverwriteClick}>Ersätt alla lokala fraser med grundutbudet</button>
        {user && (
          <button onClick={handleShowDiff}>Visa diff mellan lokal och Supabase</button>
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
      {/* Diff Modal */}
      {showDiff && diffResult && (
        <div className="diff-modal">
          <h3>Diff mellan lokal och Supabase</h3>
          {renderDiff(diffResult)}
          <div style={{ gap: 8, marginTop: 16 }}>
            <button onClick={handleMerge} disabled={mergeLoading}>
              {mergeLoading ? "Sammanfogar..." : "Merge lokal & Supabase"}
            </button>
            <button onClick={handleApplyLocalOnly}>Skriv över Supabase med lokala data</button>
            <button onClick={handleApplySupabaseOnly}>Skriv över lokalt med Supabase-data</button>
            <button onClick={() => setShowDiff(false)}>Stäng</button>
          </div>
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
