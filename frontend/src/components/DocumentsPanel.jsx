import { useRef } from "react";

export default function DocumentsPanel({
  file, onPick, onUpload, uploading, uploaded, error, chunks, docs = [], docsLoading,
}) {
  const input = useRef(null);

  return (
    <div className="chat-side">
      <section className="card">
        <div className="card-head">
          <h2>Documents</h2>
          <p>Uploadez vos documents PDF. Ils seront découpés et indexés pour que le bot puisse y répondre.</p>
        </div>

        <input
          ref={input}
          type="file"
          accept="application/pdf"
          hidden
          onChange={(e) => onPick(e.target.files[0] || null)}
        />

        <div
          className="dropzone"
          onClick={() => input.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files[0];
            if (f) onPick(f);
          }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 13v8" /><path d="m8 17 4-4 4 4" />
            <path d="M20.9 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 4 16.3" />
          </svg>
          <strong>Glissez-déposez votre PDF ici</strong>
          <span>ou cliquez pour sélectionner</span>
        </div>

        {file && (
          <div className="file-row">
            <span className="file-badge">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h6" />
              </svg>
            </span>
            <div className="file-meta">
              <span className="file-name">{file.name}</span>
              <span className="file-size">{(file.size / 1048576).toFixed(1)} MB</span>
            </div>
            <span className={uploaded ? "check check-on" : "check"}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <button className="x-btn" onClick={(e) => { e.stopPropagation(); onPick(null); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}

        <button className="btn-primary block" onClick={onUpload} disabled={!file || uploading}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h6" />
          </svg>
          {uploading ? "Indexation…" : "Uploader et indexer"}
        </button>

        {error && <p className="error">{error}</p>}
      </section>

      <section className="card doc-list">
        <span className="section-label">Documents ({docs.length})</span>

        {docsLoading ? (
          <span className="muted-13">Chargement…</span>
        ) : docs.length === 0 ? (
          <span className="muted-13">Aucun document uploadé pour ce bot.</span>
        ) : (
          docs.map((d) => (
            <div className="doc-row" key={d.id}>
              <span className="doc-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h6" />
                </svg>
              </span>
              <span className="doc-name" title={d.filename}>{d.filename}</span>
              <span className="doc-chunks">{d.chunks} AI Mem.</span>
            </div>
          ))
        )}
      </section>

      <section className="card stat-card">
        <div>
          <span className="stat-label">AI Memory</span>
          <span className="stat-value">{chunks}</span>
          <span className="stat-unit">morceaux</span>
        </div>
        <span className="stat-icon">
          <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
            <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
          </svg>
        </span>
      </section>
    </div>
  );
}
