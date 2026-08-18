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
          className={"nav-item" + (view === "publish" ? " nav-item-active" : "")}
          type="button"
          onClick={() => onView("publish")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12" />
            <path d="M2 17h20v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
            <path d="M12 7v6" /><path d="m9.5 9.5 2.5-2.5 2.5 2.5" />
          </svg>
          Publier bot
        </button>

        <button
          className={"nav-item" + (view === "docs" ? " nav-item-active" : "")}
          type="button"
          onClick={() => onView("docs")}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6.5A2.5 2.5 0 0 0 4 19.5z" />
            <path d="M8 7h7" /><path d="M8 11h7" />
          </svg>
          Documentation
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
