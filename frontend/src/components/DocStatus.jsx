export default function DocStatus({ file, chunks, indexed, error }) {
  return (
    <section className="card">
      <h2>Statut du document</h2>
      <dl className="stats">
        <div><dt>Fichier</dt><dd className="link">{file ? file.name : "—"}</dd></div>
        <div><dt>Chunks indexés</dt><dd>{chunks}</dd></div>
        <div>
          <dt>Statut</dt>
          <dd className={indexed ? "ok" : error ? "err" : ""}>
            {indexed ? "✓ Indexé avec succès" : error ? "Erreur — " + error : "En attente"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
