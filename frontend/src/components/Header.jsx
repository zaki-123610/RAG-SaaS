export default function Header({ ready, onReset }) {
  return (
    <header className="header">
      <div className="logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <div className="brand">
        <span className="brand-name">DocuMind</span>
        <span className="brand-sub">AI Document Assistant</span>
      </div>
      <div className="header-right">
        <div className="pill">
          <span className={ready ? "dot dot-on" : "dot"} />
          {ready ? "Document prêt" : "Aucun document"}
        </div>
        <button className="icon-btn" onClick={onReset} title="Réinitialiser">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </header>
  );
}
