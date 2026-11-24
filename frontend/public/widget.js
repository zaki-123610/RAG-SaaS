(function () {
  const ICON_STAR =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 1.5c.55 4.02 1.53 6.6 3.1 8.18C16.68 11.25 19.1 12.06 22.5 12c-3.4.06-5.82.87-7.4 2.45-1.57 1.58-2.55 4.16-3.1 8.05-.55-3.89-1.53-6.47-3.1-8.05C7.32 12.87 4.9 12.06 1.5 12c3.4-.06 5.82-.87 7.4-2.32C10.47 8.1 11.45 5.52 12 1.5z"/></svg>';
  const ICON_CLOCK =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
  const ICON_X =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const ICON_SEND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  if (window.__chatWidgetMounted) return;
  window.__chatWidgetMounted = true;

  const script =
    document.currentScript ||
    document.querySelector("script[data-bot-id]");
  if (!script) return console.error("[widget] script not found");

  const BOT_ID = script.getAttribute("data-bot-id");
  // data-api permet d'heberger ce fichier ailleurs que sur le backend (CDN) :
  // la bulle s'affiche alors meme si le backend est endormi.
  const API = (function () {
    const explicit = script.getAttribute("data-api");
    if (explicit) return explicit.replace(/\/+$/, "");
    try { return new URL(script.src).origin; } catch { return ""; }
  })();
  const COLOR = script.getAttribute("data-color") || "#CD1C18";
  const POSITION = script.getAttribute("data-position") || "bottom-right";
  const TITLE = script.getAttribute("data-title") || "Assistant";
  const HEADLINE = script.getAttribute("data-headline") || "How can we help?";
  const SUBTITLE = script.getAttribute("data-subtitle") || "Average response in under a minute.";
  const GREETING = script.getAttribute("data-greeting") || "Hello 👋 Ask your question, I'll answer right away.";
  const STATUS = script.getAttribute("data-status") || "Online now";
  const DEMO = script.getAttribute("data-demo") === "true";
  const WAKING = "Waking up the assistant… the first answer can take up to a minute.";

  if (!BOT_ID && !DEMO) return console.error("[widget] missing data-bot-id");

  // Reveille le backend des le chargement de la page (hebergement gratuit qui
  // s'endort) : il a ainsi demarre, ou presque, quand le visiteur pose sa
  // question. no-cors : on n'a pas besoin de lire la reponse.
  if (!DEMO && API) {
    fetch(API + "/health", { mode: "no-cors" }).catch(function () {});
  }

  if (!document.getElementById("cw-font")) {
    const l = document.createElement("link");
    l.id = "cw-font";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(l);
  }

  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483647";
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: "open" });

  const LEFT = POSITION === "bottom-left";
  const side = LEFT ? "left:24px" : "right:24px";
  const sideM = LEFT ? "left:12px" : "right:12px";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  root.innerHTML = [
    "<style>",
    ":host { --c: " + COLOR + "; }",
    "* { box-sizing:border-box; margin:0; font-family:'Archivo',system-ui,sans-serif; }",
    ".wrap { pointer-events:none; }",

    /* ---- bubble ---- */
    ".bubble { position:fixed; bottom:24px; " + side + "; width:60px; height:60px; border-radius:50%;" +
      " background:var(--c); color:#fff; border:2px solid #201e1d; cursor:pointer; pointer-events:auto;" +
      " display:grid; place-items:center; box-shadow:0 12px 26px rgba(32,30,29,.22);" +
      " transition:transform .14s ease, box-shadow .14s ease; }",
    ".bubble { animation:pop .5s cubic-bezier(.22,1.4,.4,1) both; }",
    "@keyframes pop { from { transform:scale(.4) translateY(14px); opacity:0 } to { transform:scale(1) translateY(0); opacity:1 } }",
    ".bubble::after { content:''; position:absolute; inset:-2px; border-radius:50%; border:2px solid var(--c);" +
      " animation:halo 2.8s ease-out infinite; pointer-events:none; }",
    ".open .bubble::after { animation:none; opacity:0; }",
    "@keyframes halo { 0%{ transform:scale(1); opacity:.55 } 70%,100%{ transform:scale(1.55); opacity:0 } }",
    ".bubble .ic, .bubble .x { display:grid; place-items:center; transition:transform .32s cubic-bezier(.22,1,.36,1), opacity .2s ease; }",
    ".bubble:hover .ic { transform:rotate(90deg) scale(1.08); }",
    ".open .bubble .x { animation:spin .32s cubic-bezier(.22,1,.36,1) both; }",
    "@keyframes spin { from { transform:rotate(-90deg); opacity:0 } to { transform:rotate(0); opacity:1 } }",
    ".bubble:hover { transform:translateY(-3px); box-shadow:0 18px 34px rgba(32,30,29,.3); }",
    ".bubble:active { transform:translateY(1px); }",
    ".bubble:focus-visible { outline:2px solid #201e1d; outline-offset:4px; }",
    ".bubble svg { display:block; width:24px; height:24px; }",
    ".bubble .x { display:none; }",
    ".open .bubble .x { display:block; }",
    ".open .bubble .ic { display:none; }",

    /* ---- panel ---- */
    ".panel { position:fixed; bottom:100px; " + side + "; width:372px; height:min(560px, calc(100vh - 148px));" +
      " display:none; flex-direction:column; background:#fff; overflow:hidden; pointer-events:auto;" +
      " box-shadow:0 22px 48px rgba(32,30,29,.22); opacity:0; transform:translateY(10px); border-radius:16px; }",
    ".open .panel { display:flex; animation:in .18s ease forwards; }",
    "@keyframes in { to { opacity:1; transform:translateY(0) scale(1); } }",
    ".panel { transform:translateY(14px) scale(.97); transform-origin:bottom " + (LEFT ? "left" : "right") + ";" +
      " animation-timing-function:cubic-bezier(.22,1.2,.36,1) !important; }",
    ".head > * { animation:rise .42s cubic-bezier(.22,1,.36,1) both; }",
    ".head .kick { animation-delay:.05s } .head .hl { animation-delay:.1s } .head .sub { animation-delay:.16s }",
    ".head .status { animation-delay:.22s } .head .tools { animation-delay:.28s }",
    ".head::before, .head::after { animation:none; }",
    "@keyframes rise { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:none } }",

    /* ---- header ---- */
    ".head { flex:none; background:var(--c); color:#fff; padding:22px 20px 18px; position:relative; overflow:hidden;" +
      " border-radius:16px 16px 0 0; }",
    ".head::before { content:''; position:absolute; top:-64px; right:-38px; width:180px; height:180px; border-radius:50%;" +
      " background:rgba(255,255,255,.09); }",
    ".head::after { content:''; position:absolute; bottom:-78px; right:34px; width:150px; height:150px; border-radius:50%;" +
      " background:rgba(255,255,255,.07); }",
    ".head > * { position:relative; }",
    ".kick { font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; opacity:.8; }",
    ".hl { margin-top:8px; font-size:25px; font-weight:800; letter-spacing:-.025em; line-height:1.1; padding-right:56px; }",
    ".sub { margin-top:12px; font-size:12.5px; line-height:1.45; opacity:.85; }",
    ".status { display:inline-flex; align-items:center; gap:8px; margin-top:16px; padding:7px 14px 7px 11px;" +
      " background:rgba(255,255,255,.18); border-radius:999px; font-size:12px; font-weight:600; letter-spacing:.01em; }",
    ".status i { width:9px; height:9px; border-radius:50%; background:#8ef0c4; box-shadow:0 0 0 0 rgba(142,240,196,.7);" +
      " animation:live 2s ease-out infinite; }",
    "@keyframes live { 0%{ box-shadow:0 0 0 0 rgba(142,240,196,.7) } 70%,100%{ box-shadow:0 0 0 7px rgba(142,240,196,0) } }",
    ".tools { position:absolute; top:16px; right:16px; display:flex; flex-direction:column; gap:8px; z-index:2; }",
    ".tool { width:32px; height:32px; border:none; border-radius:50%; background:rgba(255,255,255,.16); color:#fff;" +
      " cursor:pointer; display:grid; place-items:center; transition:background .18s ease, transform .18s ease; }",
    ".tool:hover { background:rgba(255,255,255,.3); transform:scale(1.06); }",
    ".tool:focus-visible { outline:2px solid #fff; outline-offset:2px; }",
    ".tool svg { width:16px; height:16px; }",

    /* ---- thread ---- */
    ".thread { flex:1; overflow-y:auto; padding:18px 20px; background:#f3f2f2; display:flex; flex-direction:column; gap:12px; }",
    ".thread::-webkit-scrollbar { width:8px; }",
    ".thread::-webkit-scrollbar-thumb { background:#cfcbc9; }",
    ".msg { flex:none; max-width:84%; padding:11px 14px; font-size:14.5px; line-height:1.55; color:#201e1d;" +
      " white-space:pre-wrap; word-wrap:break-word; }",
    ".msg, .dots { animation:msgin .34s cubic-bezier(.22,1,.36,1) both; }",
    "@keyframes msgin { from { opacity:0; transform:translateY(10px) scale(.98) } to { opacity:1; transform:none } }",
    ".a { align-self:flex-start; background:#fff; border:1px solid #d9d5d3; }",
    ".q { align-self:flex-end; background:var(--c); color:#fff; }",
    ".dots { flex:none; align-self:flex-start; display:flex; gap:5px; background:#fff; border:1px solid #d9d5d3; padding:14px; }",
    ".dots i { width:6px; height:6px; background:var(--c); animation:bl 1s infinite; }",
    ".dots i:nth-child(2) { animation-delay:.15s } .dots i:nth-child(3) { animation-delay:.3s }",
    "@keyframes bl { 0%,100%{ opacity:.28; transform:translateY(0) } 50%{ opacity:1; transform:translateY(-3px) } }",

    /* ---- input bar ---- */
    ".bar { flex:none; display:flex; gap:10px; padding:12px; background:#fff; border-top:1px solid #d9d5d3; }",
    ".bar input { flex:1; min-width:0; padding:11px 13px; border:1px solid transparent; background:#f3f2f2;" +
      " border-radius:0; font-size:14px; color:#201e1d; outline:none; }",
    ".bar input::placeholder { color:#8a8482; }",
    ".bar input:focus { border-color:var(--c); background:#fff; }",
    ".bar button { flex:none; display:flex; align-items:center; gap:8px; padding:0 18px; border:none; background:var(--c);" +
      " color:#fff; cursor:pointer; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }",
    ".bar button { transition:background .18s ease; }",
    ".bar button svg { transition:transform .22s cubic-bezier(.22,1,.36,1); }",
    ".bar button:hover:not(:disabled) svg { transform:translateX(3px); }",
    ".bar button:hover:not(:disabled) { background:#201e1d; }",
    ".bar button:disabled { opacity:.45; cursor:default; }",
    ".bar button:focus-visible { outline:2px solid #201e1d; outline-offset:2px; }",
    ".bar button svg { width:15px; height:15px; }",
    ".foot { flex:none; padding:8px 14px 10px; background:#fff; font-size:10px; letter-spacing:.1em;" +
      " text-transform:uppercase; color:#6b6664; }",

    /* ---- mobile ---- */
    "@media (max-width:520px) {",
    "  .panel { " + sideM + "; width:calc(100vw - 24px); max-width:400px; height:min(62vh, 460px); bottom:84px;" +
      " box-shadow:0 16px 36px rgba(32,30,29,.28); }",
    "  .bubble { bottom:16px; " + sideM + "; width:56px; height:56px; }",
    "  .hl { font-size:21px; }",
    "  .head { padding:18px 18px 16px; }",
    "  .bar button .txt { display:none; }",
    "}",
    "@media (max-height:560px) { .panel { height:calc(100vh - 124px); } }",
    "@media (prefers-reduced-motion:reduce) { * { animation:none !important; transition:none !important; } .panel { transform:none; opacity:1 } }",
    "</style>",

    '<div class="wrap">',
    '<div class="panel" role="dialog" aria-label="' + esc(TITLE) + '">',
    '  <div class="head">',
    '    <div class="kick">' + esc(TITLE) + "</div>",
    '    <div class="hl">' + esc(HEADLINE) + "</div>",
    '    <div class="sub">' + esc(SUBTITLE) + "</div>",
    '    <div class="status"><i></i>' + esc(STATUS) + "</div>",
    '    <div class="tools">',
    '      <button class="tool reset" aria-label="New conversation">' + ICON_CLOCK + "</button>",
    '      <button class="tool close" aria-label="Close">' + ICON_X + "</button>",
    "    </div>",
    "  </div>",
    '  <div class="thread"></div>',
    '  <div class="bar">',
    '    <input placeholder="Type a message…" aria-label="Your question" maxlength="1000" />',
    '    <button aria-label="Send"><span class="txt">Send</span>' + ICON_SEND + "</button>",
    "  </div>",
    '  <div class="foot">Powered by your assistant</div>',
    "</div>",
    '<button class="bubble" aria-label="Open chat">',
    '  <span class="ic">' + ICON_STAR + "</span>",
    '  <span class="x">' + ICON_X + "</span>",
    "</button>",
    "</div>",
  ].join("\n");

  const wrap = root.querySelector(".wrap");
  const bubble = root.querySelector(".bubble");
  const closeBtn = root.querySelector(".close");
  const thread = root.querySelector(".thread");
  const input = root.querySelector("input");
  const send = root.querySelector(".bar button");

  function toggle(force) {
    const open = force !== undefined ? force : !wrap.classList.contains("open");
    wrap.classList.toggle("open", open);
    bubble.setAttribute("aria-label", open ? "Close chat" : "Open chat");
    if (open) { greet(); setTimeout(() => input.focus(), 60); }
  }
  bubble.onclick = () => toggle();
  closeBtn.onclick = () => toggle(false);
  root.querySelector(".reset").onclick = () => {
    thread.innerHTML = "";
    greeted = false;
    greet();
    input.focus();
  };
  document.addEventListener("keydown", (e) => e.key === "Escape" && toggle(false));

  let greeted = false;
  function greet() {
    if (greeted) return;
    greeted = true;
    add("a", GREETING);
  }

  function add(cls, text) {
    const el = document.createElement("div");
    el.className = "msg " + cls;
    el.textContent = text;
    thread.appendChild(el);
    thread.scrollTop = thread.scrollHeight;
    return el;
  }

  function addTyping() {
    const el = document.createElement("div");
    el.className = "dots";
    el.innerHTML = "<i></i><i></i><i></i>";
    thread.appendChild(el);
    thread.scrollTop = thread.scrollHeight;
    return el;
  }

  async function ask() {
    const q = input.value.trim();
    if (!q || send.disabled) return;
    input.value = "";
    add("q", q);
    const typing = addTyping();
    send.disabled = true;
    let waking = null;
    const slow = setTimeout(function () {
      waking = add("a", WAKING);
      thread.insertBefore(waking, typing);
    }, 4000);
    let answer;
    try {
      if (DEMO) {
        await new Promise((r) => setTimeout(r, 900));
        answer = "Here is a demo response to: “ " + q + " ”.\nConnect data-bot-id for real answers.";
      } else {
        const res = await fetch(API + "/public/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bot_id: BOT_ID, question: q }),
        });
        const data = await res.json().catch(() => ({}));
        const detail = Array.isArray(data.detail) ? data.detail[0] && data.detail[0].msg : data.detail;
        answer = res.ok ? data.answer : detail || "Error";
      }
    } catch {
      answer = "Connection failed.";
    }
    clearTimeout(slow);
    if (waking) waking.remove();
    typing.remove();
    add("a", answer);
    send.disabled = false;
    input.focus();
  }

  send.onclick = ask;
  input.onkeydown = (e) => { if (e.key === "Enter") ask(); };

  window.ChatWidget = {
    setColor: (c) => host.style.setProperty("--c", c),
    open: () => toggle(true),
    close: () => toggle(false),
  };
})();
