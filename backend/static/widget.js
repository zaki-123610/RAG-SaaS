(function () {
  const script = document.currentScript;
  const BOT_ID = script.getAttribute("data-bot-id");
  const API = new URL(script.src).origin;
  const COLOR = script.getAttribute("data-color") || "#CD1C18";
  const POSITION = script.getAttribute("data-position") || "bottom-right";
  const TITLE = script.getAttribute("data-title") || "Assistant";

  if (!BOT_ID) return console.error("[widget] data-bot-id manquant");

  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:2147483647";
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  const side = POSITION === "bottom-left" ? "left:20px" : "right:20px";

  root.innerHTML = `
    <style>
      * { box-sizing:border-box; font-family:system-ui,sans-serif; margin:0; }
      .bubble {
        position:absolute; bottom:20px; ${side};
        width:56px; height:56px; border-radius:50%;
        background:${COLOR}; color:#fff; border:none; cursor:pointer;
        font-size:24px; box-shadow:0 4px 16px rgba(0,0,0,.25);
        pointer-events:auto;
      }
      .panel {
        position:absolute; bottom:88px; ${side};
        width:360px; height:520px; display:none;
        flex-direction:column; background:#fff; border-radius:14px;
        box-shadow:0 8px 32px rgba(0,0,0,.2); overflow:hidden;
        pointer-events:auto;
      }
      .panel.open { display:flex; }
      .head { background:${COLOR}; color:#fff; padding:14px 16px; font-weight:600; }
      .thread { flex:1; overflow-y:auto; padding:14px; background:#f7f7f8; }
      .msg { margin-bottom:10px; padding:9px 12px; border-radius:10px; font-size:14px; line-height:1.5; }
      .q { background:${COLOR}; color:#fff; margin-left:40px; }
      .a { background:#fff; border:1px solid #e5e5e5; margin-right:40px; white-space:pre-wrap; color:#111; }
      .bar { display:flex; gap:8px; padding:10px; border-top:1px solid #eee; }
      .bar input { flex:1; padding:9px 12px; border:1px solid #ddd; border-radius:8px; font-size:14px; outline:none; }
      .bar button { padding:9px 16px; background:${COLOR}; color:#fff; border:none; border-radius:8px; cursor:pointer; }
      .bar button:disabled { opacity:.5; cursor:default; }
      @media (max-width:480px) {
        .panel { width:100%; height:100%; bottom:0; left:0; right:0; border-radius:0; }
      }
    </style>
    <button class="bubble">&#128172;</button>
    <div class="panel">
      <div class="head">${TITLE}</div>
      <div class="thread"></div>
      <div class="bar">
        <input placeholder="Votre question..." />
        <button>Envoyer</button>
      </div>
    </div>
  `;

  const bubble = root.querySelector(".bubble");
  const panel = root.querySelector(".panel");
  const thread = root.querySelector(".thread");
  const input = root.querySelector("input");
  const send = root.querySelector(".bar button");

  bubble.onclick = () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) input.focus();
  };

  function add(cls, text) {
    const el = document.createElement("div");
    el.className = "msg " + cls;
    el.textContent = text;
    thread.appendChild(el);
    thread.scrollTop = thread.scrollHeight;
    return el;
  }

  async function ask() {
    const q = input.value.trim();
    if (!q || send.disabled) return;
    input.value = "";
    add("q", q);
    const bulle = add("a", "...");
    send.disabled = true;
    try {
      const res = await fetch(API + "/public/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: BOT_ID, question: q }),
      });
      const data = await res.json();
      bulle.textContent = res.ok ? data.answer : data.detail || "Erreur";
    } catch {
      bulle.textContent = "Connexion impossible.";
    } finally {
      send.disabled = false;
      input.focus();
    }
  }

  send.onclick = ask;
  input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ask();
});
})();

