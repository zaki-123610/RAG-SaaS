import { MEMORY_CAP, botColor, memPct } from "../config";

export default function BotCard({ bot, index, onOpen }) {
  const c = botColor(index);
  const pct = memPct(bot.chunks);
  const active = bot.chunks > 0;

  return (
    <article className="bot-card">
      <div className="bot-card-top">
        <span className="bot-ring" style={{ background: `conic-gradient(${c.color} ${pct * 3.6}deg, #241d1f 0)` }}>
          <span className="bot-ring-in">{pct}%</span>
        </span>

        <div className="bot-id">
          <span className="bot-name">{bot.name}</span>
          <span className="bot-mem">
            <span className="bot-mem-label">AI Memory</span>
            <span className="bot-mem-value">{bot.chunks}/{MEMORY_CAP}</span>
          </span>
        </div>
      </div>

      <div className="bot-card-foot">
        <span className={active ? "bot-state is-active" : "bot-state"}>
          {active ? "Actif" : "Vide"}
        </span>
        <button className="dm-btn" onClick={() => onOpen(bot.id)}>Discuter</button>
      </div>
    </article>
  );
}
