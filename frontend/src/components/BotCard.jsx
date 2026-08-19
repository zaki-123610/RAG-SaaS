import BotIcon from "./BotIcon";
import { MEMORY_CAP, botColor, memPct } from "../config";

export default function BotCard({ bot, index, onOpen }) {
  const c = botColor(index);

  return (
    <article className="bot-row">
      <span className="bot-avatar" style={{ background: c.tint, color: c.color }}>
        <BotIcon />
      </span>

      <div className="bot-id">
        <span className="bot-name">{bot.name}</span>
        <span className="bot-sub">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="8" ry="3" />
            <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
            <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
          </svg>
          {bot.chunks} AI Memory
          <span className="dot-sep" />
          {bot.chunks > 0 ? "Actif" : "Vide"}
        </span>
      </div>

      <div className="bot-gauge">
        <span className="gauge-head">
          Mémoire
          <span>{bot.chunks}/{MEMORY_CAP}</span>
        </span>
        <span className="gauge-track">
          <span className="gauge-fill" style={{ width: memPct(bot.chunks) + "%", background: c.color }} />
        </span>
      </div>

      <button className="btn-ghost" onClick={() => onOpen(bot.id)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Discuter
      </button>
    </article>
  );
}
