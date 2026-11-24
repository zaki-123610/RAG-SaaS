import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import * as api from "../api";
import { botColor, WIDGET_COLORS, WIDGET_DEFAULTS } from "../config";

const STEPS = ["URL du site", "Choisir un bot", "Personnaliser", "Snippet prêt"];

export default function Publish({ bots, onUnauthorized, onDocs, onRefresh }) {
  const [url, setUrl] = useState("");
  const [botId, setBotId] = useState("");
  const [color, setColor] = useState(WIDGET_DEFAULTS.color);
  const [position, setPosition] = useState(WIDGET_DEFAULTS.position);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const live = bots
    .filter((b) => b.is_public)
    .map((b) => ({ id: b.id, origin: (b.allowed_origins || [])[0] || "" }));
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const main = useRef(null);
  const dragId = useRef("");

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(main.current.children, { y: 16, opacity: 0, duration: 0.45, stagger: 0.07, clearProps: "all" });
    return () => tl.kill();
  }, []);

  const origin = useMemo(() => {
    const v = url.trim();
    if (!v) return "";
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:" ? u.origin : "";
    } catch {
      return "";
    }
  }, [url]);

  const picked = bots.find((b) => b.id === botId) || null;
  const published = !!botId && live.some((p) => p.id === botId);
  const done = [!!origin, !!botId, !!botId, published];
  const currentStep = done.findIndex((d) => !d);

  const snippet = useMemo(() => {
    const lines = ['<script src="' + api.WIDGET_SRC + '"'];
    lines.push('        data-api="' + api.API_ORIGIN + '"');
    lines.push('        data-bot-id="' + (botId || "VOTRE_BOT_ID") + '"');
    if (color.toUpperCase() !== WIDGET_DEFAULTS.color) lines.push('        data-color="' + color + '"');
    if (position !== WIDGET_DEFAULTS.position) lines.push('        data-position="' + position + '"');
    if (title.trim()) lines.push('        data-title="' + title.trim() + '"');
    return lines.join("\n") + "><\/script>";
  }, [botId, color, position, title]);

  function pick(id) {
    setBotId(id);
    setError("");
    setCopied(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
    } catch {
      /* presse-papiers refusé */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function stop(id) {
    try {
      await api.publishBot(id, false, []);
      await onRefresh();
    } catch (e) {
      if (e.status === 401) return onUnauthorized();
      setError("Impossible de retirer ce bot.");
    }
  }

  async function publish(isPublic) {
    if (!botId || busy) return;
    setBusy(true);
    setError("");
    try {
      await api.publishBot(botId, isPublic, origin ? [origin] : []);
      await onRefresh();
    } catch (e) {
      if (e.status === 401) return onUnauthorized();
      setError("Publication impossible — vérifiez que le bot vous appartient.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="dash publish" ref={main}>
      <div className="publish-head">
        <h1>Publier un bot</h1>
        <p className="muted-13">Intégrez votre bot sur n'importe quel site web via un snippet HTML.</p>
      </div>

      <div className="stepper">
        {STEPS.map((label, i) => (
          <span className="step" key={label}>
            <span className={"step-num" + (done[i] ? " is-done" : i === currentStep ? " is-current" : "")}>
              {done[i] ? "✓" : i + 1}
            </span>
            <span className={done[i] ? "step-label is-done" : "step-label"}>{label}</span>
            <span className="step-rule" />
          </span>
        ))}
      </div>

      <section className="card">
        <div className="step-head">
          <span className={"step-num" + (origin ? " is-done" : " is-current")}>{origin ? "✓" : "1"}</span>
          <span className="card-title">URL de votre site</span>
          <span className="muted-13">Origine autorisée</span>
        </div>
        <span className="url-field">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6f5f5f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M3 12h18" />
            <path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" />
          </svg>
          <input
            value={url}
            maxLength={200}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://monsite.com"
            spellCheck="false"
          />
        </span>
        {!origin && (
          <span className="gate-hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Saisissez une URL valide pour débloquer le choix du bot.
          </span>
        )}
        <span className="muted-12">
          Seule cette origine pourra interroger le bot — elle part dans <code>allowed_origins</code>.
          Laissez vide pour autoriser tous les sites.
        </span>
      </section>

      <section className={"card gated" + (origin ? "" : " is-locked")}>
        <div className="step-head">
          <span className={"step-num" + (botId ? " is-done" : origin ? " is-current" : "")}>{botId ? "✓" : "2"}</span>
          <span className="card-title">Choisir un bot</span>
        </div>
        <span className="muted-13">Glissez un bot dans la zone de dépôt, ou cliquez-le.</span>
        {origin && !botId && (
          <span className="gate-hint">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            Choisissez un bot pour débloquer la personnalisation et le snippet.
          </span>
        )}

        <div className="pick-grid">
          <div className="pick-list">
            {bots.length === 0 && <span className="muted-13">Créez d'abord un bot dans « Mes bots ».</span>}
            {bots.map((b, i) => {
              const c = botColor(i);
              const on = b.id === botId;
              return (
                <div
                  key={b.id}
                  className={on ? "pick-row is-picked" : "pick-row"}
                  draggable="true"
                  onDragEnd={() => setDragOver(false)}
                  onDragStart={(e) => {
                    dragId.current = b.id;
                    try {
                      e.dataTransfer.setData("text/plain", b.id);
                    } catch {
                      /* repli sur dragId */
                    }
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => pick(b.id)}
                >
                  <span className="bot-dot" style={{ background: c.color }} />
                  <span className="pick-id">
                    <span className="bot-name">{b.name}</span>
                    <span className="muted-12">{b.chunks} AI Memory</span>
                  </span>
                  {on && <span className="pick-flag">Sélectionné</span>}
                </div>
              );
            })}
          </div>

          <div
            className={"dropzone" + (dragOver ? " is-over" : "") + (picked ? " is-filled" : "")}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget)) return;
              setDragOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              let id = "";
              try {
                id = e.dataTransfer.getData("text/plain");
              } catch {
                /* repli */
              }
              id = id || dragId.current;
              dragId.current = "";
              if (id) pick(id);
            }}
          >
            {picked ? (
              <>
                <span className="bot-dot" style={{ background: botColor(bots.indexOf(picked)).color }} />
                <strong>{picked.name}</strong>
                <span className="ready">Prêt à publier</span>
              </>
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a3f3f" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12" /><path d="m8 11 4 4 4-4" />
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                <span className="muted-13">Déposez un bot ici</span>
              </>
            )}
          </div>
        </div>
      </section>

      <section className={"card gated" + (botId ? "" : " is-locked")}>
        <div className="step-head">
          <span className={"step-num" + (botId ? " is-current" : "")}>3</span>
          <span className="card-title">Personnaliser le widget</span>
        </div>

        <div className="tune-grid">
          <div className="tune-col">
            <span className="section-label">Couleur</span>
            <div className="color-row">
              <span className="color-chip" style={{ background: color }} />
              <input value={color} onChange={(e) => setColor(e.target.value)} spellCheck="false" className="mono-input" />
            </div>
            <div className="swatches">
              {WIDGET_COLORS.map((v) => (
                <button
                  key={v}
                  type="button"
                  title={v}
                  className={v.toLowerCase() === color.toLowerCase() ? "swatch is-on" : "swatch"}
                  style={{ background: v }}
                  onClick={() => setColor(v)}
                />
              ))}
            </div>
          </div>

          <div className="tune-col">
            <span className="section-label">Position</span>
            {[
              { key: "bottom-right", label: "Bas droite", dotX: 14 },
              { key: "bottom-left", label: "Bas gauche", dotX: 5 },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                className={position === p.key ? "pos-opt is-on" : "pos-opt"}
                onClick={() => setPosition(p.key)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <rect x={p.dotX} y="14" width="5" height="5" rx="1.2" />
                </svg>
                <span>{p.label}</span>
                {p.key === WIDGET_DEFAULTS.position && <small>défaut</small>}
              </button>
            ))}
          </div>

          <div className="tune-col">
            <span className="section-label">Titre de la fenêtre</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={WIDGET_DEFAULTS.title} className="input-plain" />
            <div className="widget-preview">
              <div className="widget-head" style={{ background: color }}>
                <span className="pip-light" />
                {title.trim() || WIDGET_DEFAULTS.title}
              </div>
              <div className="widget-body">Aperçu de l'en-tête</div>
            </div>
          </div>
        </div>
      </section>

      <section className={"card gated" + (botId ? "" : " is-locked")}>
        <div className="step-head">
          <span className={"step-num" + (published ? " is-done" : "")}>{published ? "✓" : "4"}</span>
          <span className="card-title">Snippet d'intégration</span>
          <span className={published ? "pub-state is-live" : "pub-state"}>
            {published ? "Bot publié" : "Bot non publié"}
          </span>
        </div>

        {!published && (
          <span className="muted-13">
            Le widget ne répondra qu'une fois le bot publié — cela appelle <code>PATCH /bots/{"{id}"}/publish</code>.
          </span>
        )}
        {error && <p className="error">{error}</p>}

        <div className="snippet">
          <div className="snippet-bar">
            <span className="snippet-lang">HTML</span>
            <button type="button" className="btn-ghost btn-sm" onClick={copy}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <pre>{snippet}</pre>
        </div>

        <div className="publish-actions">
          <button type="button" className="btn-primary" disabled={!botId || busy} onClick={() => publish(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
            </svg>
            {busy ? "Publication…" : published ? "Republier" : "Publier le bot"}
          </button>
          {published && (
            <button type="button" className="btn-outline-danger" onClick={() => publish(false)}>
              Dépublier
            </button>
          )}
          <span className="muted-12">
            Collez le snippet juste avant <code>&lt;/body&gt;</code>.
          </span>
        </div>
      </section>

      <section className="card">
        <div className="step-head">
          <span className="live-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.5 16a6 6 0 0 1 7 0" />
              <path d="M12 19.5h.01" /><path d="M2 9a14 14 0 0 1 20 0" />
            </svg>
          </span>
          <span className="card-title">Bots en ligne ({live.length})</span>
          <span className="muted-12">Interrogeables depuis votre site</span>
        </div>

        {live.length === 0 ? (
          <div className="live-empty">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a3f3f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" />
            </svg>
            <span className="muted-13">Aucun bot en ligne — publiez-en un ci-dessus.</span>
          </div>
        ) : (
          live.map((entry) => {
            const i = bots.findIndex((b) => b.id === entry.id);
            const bot = i >= 0 ? bots[i] : { name: entry.id, chunks: 0 };
            const c = botColor(i < 0 ? 0 : i);
            return (
              <div className="live-row" key={entry.id}>
                <span className="bot-dot" style={{ background: c.color }} />
                <span className="live-id">
                  <span className="live-name">
                    {bot.name}
                    <span className="live-pill"><span className="pip-live" />En ligne</span>
                  </span>
                  <span className="live-origin">{entry.origin || "Toutes les origines autorisées"}</span>
                </span>
                <span className="muted-12">{bot.chunks} AI Memory</span>
                <button type="button" className="btn-outline-danger btn-sm" onClick={() => stop(entry.id)}>
                  Retirer
                </button>
              </div>
            );
          })
        )}
      </section>

      <button type="button" className="doc-cta" onClick={onDocs}>
        <span className="stat-badge violet">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6.5A2.5 2.5 0 0 0 4 19.5z" />
            <path d="M8 7h7" /><path d="M8 11h7" />
          </svg>
        </span>
        <span className="doc-cta-text">
          <strong>Documentation d'intégration</strong>
          <span>Attributs du widget, endpoints publics, limites et dépannage.</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6f5f5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>
    </main>
  );
}
