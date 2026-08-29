import { botColor, memShare } from "../config";

export default function Profile({ user, bots, usage, onDeleteBot }) {
  const memory = usage ? usage.used : bots.reduce((n, b) => n + b.chunks, 0);
  const cap = usage ? usage.limit : 0;
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
            <span className="tag-pro">Compte vérifié</span>
            <span className="muted-12">ID #{user.id}</span>
          </span>
        </div>
      </section>

      <div className="stat-grid">
        <section className="card stat">
          <span className="stat-label">Total chatbots</span>
          <span className="stat-num">{bots.length}</span>
        </section>

        <section className="card stat">
          <span className="stat-label">AI Memory totale</span>
          <span className="stat-num">{memory}<small>{cap ? "/ " + cap : "u"}</small></span>
        </section>

        <section className="card stat">
          <span className="stat-label">Moyenne par bot</span>
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
                <span className="mini-dot" style={{ background: c.color }} />
                <span className="mini-name">{b.name}</span>
                <span className="gauge-track mini-track">
                  <span className="gauge-fill" style={{ width: memShare(b.chunks, bots, cap) + "%", background: c.color }} />
                </span>
                <span className="mini-value">{b.chunks} AI Mem.</span>
                <button type="button" className="btn-remove" onClick={() => onDeleteBot(b.id)}>Supprimer</button>
              </div>
            );
          })
        )}
      </section>

      <section className="danger">
        <div className="danger-head">
          Zone de danger
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
