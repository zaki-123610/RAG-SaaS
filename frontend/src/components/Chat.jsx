import { useRef, useEffect } from "react";

export default function Chat({ messages, question, onQuestion, onSend, asking, disabled }) {
  const scroller = useRef(null);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages]);

  return (
    <section className="chat">
      <div className="card-head chat-head">
        <h2>Conversation</h2>
        <p>Posez des questions sur votre document. Les réponses sont basées sur le contenu indexé.</p>
      </div>

      <div className="thread" ref={scroller}>
        {messages.length === 0 && (
          <p className="empty">
            Aucune question pour l'instant. Indexez un PDF puis demandez ce que vous voulez savoir.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className="exchange">
            <div className="from-user">
              <div className="bubble-user">
                <p>{m.q}</p>
                <time>{m.t}</time>
              </div>
            </div>
            <div className="from-bot">
              <span className="avatar">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 4.6L18.5 9.5l-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
                  <path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z" />
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
        <div className="composer-box">
          <textarea
            rows={2}
            disabled={disabled}
            placeholder={disabled ? "Upload a PDF first..." : "Type your question..."}
            value={question}
            onChange={(e) => onQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
            }}
          />
          <button className="btn-primary" onClick={onSend} disabled={asking || !question.trim() || disabled}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
            </svg>
            {asking ? "…" : "Envoyer"}
          </button>
        </div>
        <p className="hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" />
          </svg>
          Appuyez sur Entrée pour envoyer
        </p>
      </div>
    </section>
  );
}
