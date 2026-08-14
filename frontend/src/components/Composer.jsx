export default function Composer({ value, onChange, onSubmit, busy }) {
  return (
    <form className="composer" onSubmit={onSubmit}>
      <input
        className="input"
        placeholder="c'est quoi ARMA ?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button className="btn btn-primary" type="submit" disabled={busy || !value.trim()}>
        {busy ? "…" : "Envoyer"}
      </button>
    </form>
  );
}
