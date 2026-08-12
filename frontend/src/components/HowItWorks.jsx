const STEPS = [
  "Uploadez votre PDF",
  "Le document est indexé",
  "Posez vos questions",
  "L'IA répond à partir du contenu",
];

export default function HowItWorks() {
  return (
    <section className="card card-tint">
      <div className="tint-head">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v3" /><path d="m6.6 6.6 2.1 2.1" /><path d="M3 12h3" />
          <circle cx="12" cy="14" r="4" />
        </svg>
        <span>Comment ça marche ?</span>
      </div>
      <ol className="steps">
        {STEPS.map((s, i) => (
          <li key={i}><span>{i + 1}.</span>{s}</li>
        ))}
      </ol>
    </section>
  );
}
