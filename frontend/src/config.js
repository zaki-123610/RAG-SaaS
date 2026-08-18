export const MEMORY_CAP = 200;

export const BOT_COLORS = [
  { color: "#CD1C18", tint: "#2a0f10" },
  { color: "#8B5CF6", tint: "#1b1233" },
  { color: "#06B6D4", tint: "#07222b" },
  { color: "#10B981", tint: "#0a2320" },
];

export const botColor = (i) => BOT_COLORS[i % BOT_COLORS.length];
export const memPct = (chunks) => Math.min(100, Math.round((chunks / MEMORY_CAP) * 100));

// défauts réels de backend/static/widget.js
export const WIDGET_DEFAULTS = { color: "#CD1C18", position: "bottom-right", title: "Assistant" };
export const WIDGET_COLORS = ["#CD1C18", "#2563EB", "#8B5CF6", "#10B981"];
