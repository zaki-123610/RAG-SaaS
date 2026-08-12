export default function Messages({ messages }) {
  if (!messages.length) {
    return (
      <main className="messages">
        <p className="empty">
          Indexez un PDF, puis posez une question. Les réponses sont tirées uniquement du document.
        </p>
      </main>
    );
  }
  return (
    <main className="messages">
      {messages.map((m, i) => (
        <article key={i} className="exchange">
          <div className="line">
            <span className="tag-q">Q</span>
            <p className="question">{m.q}</p>
          </div>
          <div className="line">
            <span className="tag-a">R</span>
            <p className="answer">{m.a}</p>
          </div>
        </article>
      ))}
    </main>
  );
}
