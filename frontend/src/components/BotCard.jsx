import { MEMORY_CAP, botColor, memPct } from "../config";

export default function BotCard({ bot, index, onOpen, onRemove }) {
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
          <span className="bot-mem">{bot.chunks} AI Memory</span>
          <span className={active ? "bot-state is-active" : "bot-state"}>{active ? "Actif" : "Vide"}</span>
        </div>

        {onRemove && (
          <button type="button" className="btn-remove" onClick={() => onRemove(bot.id)}>Supprimer</button>
        )}
      </div>

      <div className="bot-card-foot">
        <span className="bot-foot-id">
          <span className="bot-foot-label">Mémoire</span>
          <span className="bot-foot-value">{bot.chunks}/{MEMORY_CAP}</span>
        </span>
        <button className="dm-btn" onClick={() => onOpen(bot.id)}>Discuter</button>
      </div>
    </article>
  );
}
