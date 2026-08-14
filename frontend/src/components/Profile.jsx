import BotIcon from "./BotIcon";
import { botColor, memPct } from "../config";

export default function Profile({ user, bots }) {
  const memory = bots.reduce((n, b) => n + b.chunks, 0);
  const average = bots.length ? Math.round(memory / bots.length) : 0;

  return (
    <main className="dash">
      <h1>Mon profil</h1>

      <section className="card account">
        <span className="account-avatar">{(user.email || "?").charAt(0).toUpperCase()}</span>
        <div className="account-id">
          <span className="account-mail">{user.email}</span>
          <span className="muted-13">Adresse email principale du compte</span>
          <span className="account-tags">
            <span className="tag-pro">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Compte vérifié
            </span>
            <span className="muted-12">ID #{user.id}</span>
          </span>
        </div>
      </section>

      <div className="stat-grid">
        <section className="card stat">
          <span className="stat-top">
            Total chatbots
            <span className="stat-badge red">
              <BotIcon size={16} />
            </span>
          </span>
          <span className="stat-num">{bots.length}</span>
        </section>

        <section className="card stat">
          <span className="stat-top">
            AI Memory totale
            <span className="stat-badge violet">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="8" ry="3" />
                <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
                <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
              </svg>
            </span>
          </span>
          <span className="stat-num">{memory}<small>u</small></span>
        </section>

        <section className="card stat">
          <span className="stat-top">
            Moyenne par bot
            <span className="stat-badge cyan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
          </span>
          <span className="stat-num">{average}<small>AI Mem.</small></span>
        </section>
      </div>

      <section className="card">
        <span className="section-label">Mes bots</span>
        {bots.length === 0 ? (
          <span className="muted-13">Aucun bot pour l'instant.</span>
        ) : (
          bots.map((b, i) => {
            const c = botColor(i);
            return (
              <div className="mini-row" key={b.id}>
                <span className="mini-avatar" style={{ background: c.tint, color: c.color }}>
                  <BotIcon size={17} />
                </span>
                <span className="mini-name">{b.name}</span>
                <span className="gauge-track mini-track">
                  <span className="gauge-fill" style={{ width: memPct(b.chunks) + "%", background: c.color }} />
                </span>
                <span className="mini-value">{b.chunks} AI Mem.</span>
              </div>
            );
          })
        )}
      </section>

      <section className="danger">
        <div className="danger-head">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
            <path d="M12 9v4" /><path d="M12 17h.01" />
          </svg>
          Zone de danger
        </div>
        <div className="danger-row">
          <div>
            <strong>Supprimer un bot</strong>
            <span>Efface le bot et toutes ses données AI Memory — nécessite <code>DELETE /bots/{"{id}"}</code></span>
          </div>
          <button className="btn-outline-danger" disabled title="Endpoint backend manquant">Supprimer un bot</button>
        </div>
        <div className="danger-row">
          <div>
            <strong>Supprimer le compte</strong>
            <span>Supprime définitivement votre compte et toutes les données — nécessite <code>DELETE /me</code></span>
          </div>
          <button className="btn-danger" disabled title="Endpoint backend manquant">Supprimer le compte</button>
        </div>
      </section>
    </main>
  );
}
