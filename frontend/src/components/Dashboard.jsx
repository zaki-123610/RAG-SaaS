import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import Sidebar from "./Sidebar";
import BotCard from "./BotCard";

export default function Dashboard({ bots, view, onView, onOpen, onCreate, onLogout, onUnauthorized, profile }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef(null);
  const main = useRef(null);
  const grid = useRef(null);
  const viewTween = useRef(null);
  const cardTween = useRef(null);
  const seen = useRef(0); // nombre de bots deja animes, pour ne jouer l entree qu une fois

  useEffect(() => {
    if (view === "profile" || !main.current) return;
    viewTween.current?.kill();
    viewTween.current = gsap.fromTo(
      main.current.children,
      { y: 18, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: "power2.out", clearProps: "transform,opacity" }
    );
  }, [view]);

  useEffect(() => {
    const cards = grid.current && [...grid.current.children];
    if (!cards || !cards.length) return;

    const nouvelles = cards.slice(seen.current);
    seen.current = cards.length;
    if (!nouvelles.length) return;

    cardTween.current?.kill();
    cardTween.current = gsap.fromTo(
      nouvelles,
      { y: 22, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: "back.out(1.4)", clearProps: "transform,opacity" }
    );

    // jauges de memoire : remplissage anime depuis la gauche
    nouvelles.forEach((card) => {
      const fill = card.querySelector(".gauge-fill");
      if (!fill) return;
      const cible = fill.style.width;
      gsap.fromTo(fill, { width: "0%" }, { width: cible, duration: 0.6, delay: 0.2, ease: "power2.out" });
    });
  }, [bots.length]);

  async function create(e) {
    e.preventDefault();
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    setError("");
    try {
      await onCreate(n);
      setName("");
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <Sidebar view={view} onView={onView} onLogout={onLogout} />

      {view === "profile" ? profile : (
      <main className="dash" ref={main}>
        <div className="dash-head">
          <div>
            <h1>Vos chatbots</h1>
            <p>Chaque bot possède son propre index de documents et AI Memory.</p>
          </div>
          <button className="btn-primary" onClick={() => input.current.focus()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14" /><path d="M5 12h14" />
            </svg>
            Nouveau bot
          </button>
        </div>

        <form className="card create-form" onSubmit={create}>
          <span className="card-title">Créer un nouveau bot</span>
          <div className="inline-form">
            <input
              ref={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de votre bot..."
            />
            <button className="btn-primary" type="submit" disabled={busy || !name.trim()}>
              Créer
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </form>

        <section className="bots">
          <span className="section-label">Mes bots ({bots.length})</span>
          {bots.length === 0 ? (
            <div className="empty-bots">
              <span className="bot-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8V5" />
                  <path d="M8.5 14h.01" /><path d="M15.5 14h.01" />
                </svg>
              </span>
              <strong>Aucun bot pour l'instant</strong>
              <span>Donnez un nom à votre premier bot ci-dessus, puis uploadez un PDF pour l'entraîner.</span>
            </div>
          ) : (
            <div className="bot-list" ref={grid}>
              {bots.map((b, i) => (
                <BotCard key={b.id} bot={b} index={i} onOpen={onOpen} />
              ))}
            </div>
          )}
        </section>
      </main>
      )}
    </div>
  );
}
