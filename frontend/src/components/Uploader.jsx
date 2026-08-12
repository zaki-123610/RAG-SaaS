import { useRef } from "react";

export default function Uploader({ file, onPick, onUpload, uploading }) {
  const input = useRef(null);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Votre document</h2>
        <p>Upload a PDF pour commencer.</p>
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
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 13v8" /><path d="m8 17 4-4 4 4" />
          <path d="M20.9 18.4A5 5 0 0 0 18 9h-1.3A8 8 0 1 0 4 16.3" />
        </svg>
        <strong>Glissez votre PDF ici</strong>
        <span>ou cliquez pour parcourir</span>
      </div>

      {file && (
        <div className="file-row">
          <span className="file-badge">PDF</span>
          <div className="file-meta">
            <span className="file-name">{file.name}</span>
            <span className="file-size">{(file.size / 1048576).toFixed(2)} MB</span>
          </div>
          <button
            className="x-btn"
            onClick={(e) => { e.stopPropagation(); onPick(null); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}

      <button className="btn-primary block" onClick={onUpload} disabled={!file || uploading}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12" /><path d="m8 7 4-4 4 4" />
          <path d="M20 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
        </svg>
        {uploading ? "Indexation…" : "Uploader & indexer le PDF"}
      </button>
    </section>
  );
}
