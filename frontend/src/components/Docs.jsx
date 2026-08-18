import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { API_ORIGIN } from "../api";
import { WIDGET_DEFAULTS } from "../config";

const SNIPPET =
  '<script src="' + API_ORIGIN + '/static/widget.js"\n        data-bot-id="VOTRE_BOT_ID"><\/script>';

const WHERE = [
  ["HTML classique", <>Dans votre <code>index.html</code>, avant <code>&lt;/body&gt;</code>.</>],
  ["WordPress", <>Apparence → Éditeur de fichiers du thème → <code>footer.php</code>, ou une extension comme <em>Insert Headers and Footers</em>.</>],
  ["Shopify", <>Boutique en ligne → Thèmes → Modifier le code → <code>theme.liquid</code>, avant <code>&lt;/body&gt;</code>.</>],
  ["Wix / Squarespace", <>Paramètres → Code personnalisé → Ajouter le code au <code>&lt;body&gt;</code> (fin).</>],
  ["React (Vite / CRA)", <>Dans <code>index.html</code>, pas dans un composant.</>],
  ["Next.js", <>Dans <code>app/layout.tsx</code>, avec le composant <code>&lt;Script&gt;</code> et <code>strategy="afterInteractive"</code>.</>],
];

const ATTRS = [
  ["data-color", WIDGET_DEFAULTS.color, "#2563eb"],
  ["data-position", WIDGET_DEFAULTS.position, "bottom-left"],
  ["data-title", WIDGET_DEFAULTS.title, "Support"],
];

const ISSUES = [
  ["La bulle n'apparaît pas", <>Vérifiez que le bot est publié et que le snippet se trouve dans <code>&lt;body&gt;</code>, pas dans <code>&lt;head&gt;</code>.</>],
  ["« Ce domaine n'est pas autorisé »", <>Ajoutez l'URL de votre site dans le champ Domaines autorisés de l'écran « Publier bot ». Utilisez le domaine exact que voient vos visiteurs, sans slash final.</>],
  ["Rien ne se passe au premier message", <>Le serveur peut mettre jusqu'à une minute à démarrer sur le plan gratuit.</>],
];

export default function Docs({ onPublish }) {
  const main = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(main.current.children, { y: 16, opacity: 0, duration: 0.45, stagger: 0.07, clearProps: "all" });
    return () => tl.kill();
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(SNIPPET);
    } catch {
      /* presse-papiers refusé */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className="dash docs" ref={main}>
      <div className="publish-head">
        <h1>Documentation</h1>
        <p className="muted-13">Installer le widget DocuMind sur votre site.</p>
      </div>

      <section className="card">
        <span className="section-label">Où le coller</span>
        <div className="doc-table">
          {WHERE.map(([name, body]) => (
            <div className="doc-where" key={name}>
              <span className="where-name">{name}</span>
              <span className="where-body">{body}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <span className="section-label">Personnalisation (facultatif)</span>
        <div className="doc-table">
          <div className="doc-attr doc-attr-head">
            <span>Attribut</span>
            <span>Par défaut</span>
            <span>Exemple</span>
          </div>
          {ATTRS.map(([name, def, ex]) => (
            <div className="doc-attr" key={name}>
              <code className="code-accent">{name}</code>
              <code className="code-default">{def}</code>
              <code className="code-muted">{ex}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <span className="section-label">En cas de problème</span>
        <div className="doc-table">
          {ISSUES.map(([title, body]) => (
            <div className="doc-issue" key={title}>
              <span className="where-name">{title}</span>
              <span className="where-body">{body}</span>
            </div>
          ))}
        </div>
        <button type="button" className="btn-primary" onClick={onPublish}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5" /><path d="m5 12 7-7 7 7" />
          </svg>
          Retour à la publication
        </button>
      </section>
    </main>
  );
}
