const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "documind_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function unwrap(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.detail || "HTTP " + res.status);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

function auth(extra = {}) {
  return { ...extra, Authorization: "Bearer " + getToken() };
}

/* ---- auth ---- */

export async function register(email, password) {
  const data = await unwrap(
    await fetch(API + "/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
  setToken(data.access_token);
  return data;
}

export async function login(email, password) {
  const data = await unwrap(
    await fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
  setToken(data.access_token);
  return data;
}

export async function me() {
  return unwrap(await fetch(API + "/me", { headers: auth() })); // { id, email }
}

/* ---- bots ---- */

export async function listBots() {
  return unwrap(await fetch(API + "/bots", { headers: auth() })); // [{ id, name, chunks }]
}

export async function createBot(name) {
  return unwrap(
    await fetch(API + "/bots", {
      method: "POST",
      headers: auth({ "Content-Type": "application/json" }),
      body: JSON.stringify({ name }),
    })
  ); // { id, name, chunks }
}

export async function listDocuments(botId) {
  return unwrap(
    await fetch(API + "/bots/" + encodeURIComponent(botId) + "/documents", { headers: auth() })
  ); // [{ id, filename, chunks }]
}

export async function deleteBot(botId) {
  return unwrap(
    await fetch(API + "/bots/" + encodeURIComponent(botId), { method: "DELETE", headers: auth() })
  );
}

export async function deleteDocument(botId, docId) {
  return unwrap(
    await fetch(
      API + "/bots/" + encodeURIComponent(botId) + "/documents/" + encodeURIComponent(docId),
      { method: "DELETE", headers: auth() }
    )
  );
}

/* ---- rag ---- */

// /upload renvoie les chunks DU DOCUMENT ; le total cumulé vit dans /bots
export async function uploadPdf(botId, file) {
  const fd = new FormData();
  fd.append("bot_id", botId);
  fd.append("file", file);
  return unwrap(
    await fetch(API + "/upload", { method: "POST", headers: auth(), body: fd })
  ); // { bot_id, chunks }
}

export async function askQuestion(botId, question) {
  return unwrap(
    await fetch(API + "/query", {
      method: "POST",
      headers: auth({ "Content-Type": "application/json" }),
      body: JSON.stringify({ bot_id: botId, question }),
    })
  ); // { answer }
}
