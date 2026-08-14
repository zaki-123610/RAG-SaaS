import Logo from "./Logo";

export default function Sidebar({ view, onView, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Logo />
        <span className="wordmark">Docu<span>Mind</span></span>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={"nav-item" + (view === "bots" ? " nav-item-active" : "")}
          onClick={() => onView("bots")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8V5" />
            <path d="M8 14h.01" /><path d="M16 14h.01" />
          </svg>
          Mes bots
        </button>

        <button
          type="button"
          className={"nav-item" + (view === "profile" ? " nav-item-active" : "")}
          onClick={() => onView("profile")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          Profil
        </button>
      </nav>

      <button className="nav-item logout" onClick={onLogout}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
        </svg>
        Déconnexion
      </button>
    </aside>
  );
}
