const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
export const BOT_ID = "demo";

export async function uploadPdf(file) {
  const fd = new FormData();
  fd.append("bot_id", BOT_ID);
  fd.append("file", file);
  const res = await fetch(API + "/upload", { method: "POST", body: fd });
  if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new Error(body.detail || "HTTP " + res.status);
    }
  return res.json(); // { bot_id, chunks }
}

export async function askQuestion(question) {
  const res = await fetch(API + "/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bot_id: BOT_ID, question }),
  });
  if (!res.ok) {
  const body = await res.json().catch(() => ({}));
  throw new Error(body.detail || "HTTP " + res.status);
    }
  return res.json(); // { answer }
}
