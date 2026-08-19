import { useState } from "react";
import Logo from "./Logo";

export default function Sidebar({ view, onView, onLogout }) {
  const [open, setOpen] = useState(false);

  // sur mobile / tablette la nav est repliée derrière le bouton menu
  const go = (v) => {
    onView(v);
    setOpen(false);
  };

  return (
    <aside className={"sidebar" + (open ? " sidebar-open" : "")}>
      <div className="sidebar-brand">
        <Logo />
        <span className="wordmark">Docu<span>Mind</span></span>

        <button
          type="button"
          className="burger"
          aria-expanded={open}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M6 6l12 12" /><path d="M18 6 6 18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button type="button" className={"nav-item" + (view === "bots" ? " nav-item-active" : "")} onClick={() => go("bots")}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8V5" />
            <path d="M8 14h.01" /><path d="M16 14h.01" />
          </svg>
          Mes bots
        </button>

        <button type="button" className={"nav-item" + (view === "publish" ? " nav-item-active" : "")} onClick={() => go("publish")}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12" />
            <path d="M2 17h20v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
            <path d="M12 7v6" /><path d="m9.5 9.5 2.5-2.5 2.5 2.5" />
          </svg>
          Publier bot
        </button>

        <button type="button" className={"nav-item" + (view === "docs" ? " nav-item-active" : "")} onClick={() => go("docs")}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6.5A2.5 2.5 0 0 0 4 19.5z" />
            <path d="M8 7h7" /><path d="M8 11h7" />
          </svg>
          Documentation
        </button>

        <button type="button" className={"nav-item" + (view === "profile" ? " nav-item-active" : "")} onClick={() => go("profile")}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
          Profil
        </button>
      </nav>

      <button className="nav-item logout" type="button" onClick={onLogout}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" />
        </svg>
        Déconnexion
      </button>
    </aside>
  );
}
