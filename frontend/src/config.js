export const BOT_COLORS = [
  { color: "#CD1C18", tint: "#2a0f10" },
  { color: "#8B5CF6", tint: "#1b1233" },
  { color: "#06B6D4", tint: "#07222b" },
  { color: "#10B981", tint: "#0a2320" },
];

export const botColor = (i) => BOT_COLORS[i % BOT_COLORS.length];

export const memShare = (chunks, bots = [], cap = 0) => {
  if (!chunks) return 0;
  const top = Math.max(1, ...bots.map((b) => b.chunks));
  return Math.max(6, Math.min(100, Math.round((chunks / (cap || top)) * 100)));
};

export const memLabel = (chunks, cap = 0) =>
  cap ? chunks + " / " + cap
      : chunks === 1 ? "1 morceau indexé" : chunks + " morceaux indexés";

// défauts réels de backend/static/widget.js
export const WIDGET_DEFAULTS = { color: "#CD1C18", position: "bottom-right", title: "Assistant" };
export const WIDGET_COLORS = ["#CD1C18", "#2563EB", "#8B5CF6", "#10B981"];
