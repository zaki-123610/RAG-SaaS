import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import * as api from "../api";
import DocumentsPanel from "./DocumentsPanel";

const now = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function ChatScreen({ bot, onBack, onUploaded, onUnauthorized }) {

  if (!bot) return null;

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState("");
  const [chunks, setChunks] = useState(bot ? bot.chunks : 0);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const scroller = useRef(null);
  const layout = useRef(null);

  useEffect(() => {
    gsap.fromTo(layout.current.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, stagger: 0.1, ease: "power3.out" });
  }, []);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
    const items = scroller.current && scroller.current.querySelectorAll(".exchange");
    const last = items && items[items.length - 1];
    if (last) {
      gsap.fromTo(last.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.09, ease: "power2.out" });
    }
  }, [messages]);

  async function loadDocs() {
    try {
      setDocs(await api.listDocuments(bot.id));
    } catch (e) {
      if (e.status === 401) return onUnauthorized();
    } finally {
      setDocsLoading(false);
    }
  }

  useEffect(() => {
    setDocsLoading(true);
    loadDocs();
  }, [bot.id]);

  async function removeDoc(docId) {
    if (!window.confirm("Supprimer ce document et son AI Memory ?")) return;
    try {
      await api.deleteDocument(bot.id, docId);
      await loadDocs();
      const list = await api.listBots();
      const fresh = list.find((b) => b.id === bot.id);
      setChunks(fresh ? fresh.chunks : 0);
      if (onUploaded) onUploaded();
    } catch (e) {
      if (e.status === 401) onUnauthorized();
    }
  }

  function pick(f) {
    setFile(f);
    setUploaded(false);
    setError("");
  }

async function upload() {
    if (!file || uploading) return;
    setUploading(true);
    setError("");

    // Timer pour le "Cold Start" de Render (si l'upload prend plus de 4s)
    const timer = setTimeout(
      () => setError("Le serveur démarre, cela peut prendre 1 minute…"),
      4000
    );

    try {
      await api.uploadPdf(bot.id, file);
      // le total cumulé n'est lisible que via /bots
      const list = await api.listBots();
      const fresh = list.find((b) => b.id === bot.id);
      setChunks(fresh ? fresh.chunks : 0);
      setUploaded(true);
      await loadDocs();
      if (onUploaded) onUploaded();
    } catch (e) {
      if (e.status === 401) return onUnauthorized();
      setError(e.message);
    } finally {
      clearTimeout(timer); // On annule le timer si la requête se termine
      setUploading(false);
    }
  }

  async function send() {
    const q = question.trim();
    if (!q || asking) return;
    setMessages((m) => [...m, { q, t: now(), a: "…", ta: "" }]);
    setQuestion("");
    setAsking(true);
    let answer;
    try {
      answer = (await api.askQuestion(bot.id, q)).answer;
    } catch (e) {
      if (e.status === 401) { onUnauthorized(); return; }
      answer = "Erreur — " + e.message;
    }
    setMessages((m) =>
      m.map((msg, i) => (i === m.length - 1 ? { ...msg, a: answer, ta: now() } : msg))
    );
    setAsking(false);
  }

  return (
    <div className="chat-screen">
      <div className="chat-topbar">
        <button className="back" onClick={onBack}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
          </svg>
          Retour
        </button>
        <h1>{bot ? bot.name : "Bot"}</h1>
        <button className="pencil" aria-label="Renommer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
      </div>

      <div className="chat-layout" ref={layout}>
        <DocumentsPanel
          file={file}
          onPick={pick}
          onUpload={upload}
          uploading={uploading}
          uploaded={uploaded}
          error={error}
          chunks={chunks}
          docs={docs}
          docsLoading={docsLoading}
          onDeleteDoc={removeDoc}
        />

        <section className="card conversation">
          <div className="conv-head">
            <div>
              <h2>Conversation</h2>
              <p>Posez vos questions sur vos documents.</p>
            </div>
            <button className="btn-ghost" onClick={() => setMessages([])}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
              </svg>
              Réinitialiser la conversation
            </button>
          </div>

          <div className="thread" ref={scroller}>
            {messages.length === 0 && (
              <p className="empty">Indexez un PDF, puis posez votre première question.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className="exchange">
                <div className="from-user">
                  <div className="bubble-user">
                    <p>{m.q}</p>
                    <span className="stamp">
                      {m.t}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m2 12 5 5L17 7" /><path d="m11 15 2 2L22 8" />
                      </svg>
                    </span>
                  </div>
                </div>
                <div className="from-bot">
                  <span className="avatar">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="8" width="18" height="12" rx="2" /><path d="M12 8V5" />
                      <path d="M8.5 14h.01" /><path d="M15.5 14h.01" />
                    </svg>
                  </span>
                  <div className="bubble-bot">
                    <p>{m.a}</p>
                    {m.ta && <time>{m.ta}</time>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="composer">
            <input
              placeholder="Posez votre question..."
              maxLength={1000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
            />
            <button className="btn-primary" onClick={send} disabled={asking || !question.trim()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
              </svg>
              {asking ? "…" : "Envoyer"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
