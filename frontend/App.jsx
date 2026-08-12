import { useState, useRef, useEffect } from "react";
import { uploadPdf, askQuestion, BOT_ID } from "./api";
import Header from "./components/Header";
import Uploader from "./components/Uploader";
import DocStatus from "./components/DocStatus";
import HowItWorks from "./components/HowItWorks";
import Chat from "./components/Chat";
import "./styles.css";

const now = () =>
  new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function App() {
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [chunks, setChunks] = useState(0);
  const [indexed, setIndexed] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);

  function pickFile(f) {
    setFile(f);
    setIndexed(false);
    setChunks(0);
    setError("");
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    try {
      const data = await uploadPdf(file);
      setChunks(data.chunks);
      setIndexed(true);
    } catch (e) {
      setError(e.message);
      setIndexed(false);
    } finally {
      setUploading(false);
    }
  }

  async function handleSend() {
    const q = question.trim();
    if (!q || asking) return;
    setMessages((m) => [...m, { q, t: now(), a: "…", ta: "" }]);
    setQuestion("");
    setAsking(true);
    let answer;
    try {
      answer = (await askQuestion(q)).answer;
    } catch (e) {
      answer = "Erreur — " + e.message;
    }
    setMessages((m) =>
      m.map((msg, i) => (i === m.length - 1 ? { ...msg, a: answer, ta: now() } : msg))
    );
    setAsking(false);
  }

  function reset() {
    setFile(null); setMessages([]); setQuestion("");
    setChunks(0); setIndexed(false); setError("");
  }

  return (
    <div className="app">
      <Header ready={indexed} onReset={reset} botId={BOT_ID} />
      <div className="layout">
        <aside className="sidebar">
          <Uploader
            file={file}
            onPick={pickFile}
            onUpload={handleUpload}
            uploading={uploading}
          />
          <DocStatus file={file} chunks={chunks} indexed={indexed} error={error} />
          <HowItWorks />
        </aside>
        <Chat
          messages={messages}
          question={question}
          onQuestion={setQuestion}
          onSend={handleSend}
          asking={asking}
        />
      </div>
    </div>
  );
}
