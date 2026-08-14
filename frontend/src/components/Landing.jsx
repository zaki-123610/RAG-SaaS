import { useEffect, useRef } from "react";
import gsap from "gsap";
import Logo from "./Logo";
import BotIcon from "./BotIcon";

export default function Landing({ onLogin, onRegister }) {
  const nav = useRef(null);
  const copy = useRef(null);
  const mock = useRef(null);
  const stage = useRef(null);

  useEffect(() => {
    const badges = stage.current.querySelectorAll(".float-badge");
    const dots = stage.current.querySelectorAll(".typing span");
    gsap.fromTo(nav.current.children, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: "power2.out" });
    gsap.fromTo(copy.current.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.09, delay: 0.1, ease: "power3.out" });
    gsap.fromTo(mock.current, { y: 30, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: "power3.out" });
    gsap.fromTo(badges, { y: 16, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.12, delay: 0.7, ease: "back.out(1.6)" });
    gsap.to(badges, { y: -7, duration: 2.6, repeat: -1, yoyo: true, ease: "sine.inOut", stagger: 0.5, delay: 1.2 });
    gsap.to(dots, { opacity: 0.25, duration: 0.42, repeat: -1, yoyo: true, stagger: 0.14, ease: "sine.inOut" });
  }, []);

  return (
    <div className="landing">
      <header className="landing-nav" ref={nav}>
        <Logo size={38} />
        <span className="wordmark wordmark-md">Docu<span>Mind</span></span>
        <button className="link-nav" onClick={onLogin}>Connexion</button>
        <button className="btn-primary" onClick={onRegister}>S'inscrire</button>
      </header>

      <div className="hero">
        <div className="hero-copy" ref={copy}>
          <span className="badge-pill">
            <span className="pip" />
            IA documentaire
          </span>
          <h1>Vos documents,<br /><span>intelligents.</span></h1>
          <p>
            DocuMind transforme vos fichiers en chatbots capables de répondre à vos
            questions — précisément, instantanément.
          </p>
          <button className="btn-primary btn-lg" onClick={onRegister}>
            Commencer gratuitement
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
            </svg>
          </button>
          <span className="hero-rule" />
          <div className="social">
            <span className="avatars">
              {["#CD1C18", "#8B5CF6", "#06B6D4", "#10B981"].map((bg) => (
                <span key={bg} style={{ background: bg }}><BotIcon size={15} /></span>
              ))}
            </span>
            <span><strong>Un bot par sujet</strong> — chacun avec sa propre mémoire</span>
          </div>
        </div>

        <div className="hero-stage" ref={stage}>
          <div className="mock" ref={mock}>
            <div className="mock-head">
              <Logo size={38} />
              <div>
                <span className="mock-name">support-client</span>
                <span className="mock-meta">42 AI Memory</span>
              </div>
            </div>
            <div className="mock-body">
              <div className="from-user">
                <p className="bubble-user">Quelle est votre politique de remboursement ?</p>
              </div>
              <div className="from-bot">
                <span className="mock-avatar"><BotIcon size={15} /></span>
                <p className="bubble-bot">
                  Selon vos documents, vous bénéficiez d'un remboursement sous 30 jours
                  sans condition.
                </p>
              </div>
              <div className="from-user">
                <p className="bubble-user">Merci, et les délais de livraison ?</p>
              </div>
              <div className="typing"><span /><span /><span /></div>
              <div className="mock-composer">
                <span>Posez votre question...</span>
                <span className="send">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          <div className="float-badge badge-tr">
            <span className="stat-badge green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 17 6-6 4 4 7-7" /><path d="M14 8h6v6" />
              </svg>
            </span>
            <span className="float-text"><strong>Réponses sourcées</strong><span>Depuis vos documents</span></span>
          </div>

          <div className="float-badge badge-bl">
            <span className="stat-badge violet">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h6" />
              </svg>
            </span>
            <span className="float-text"><strong>PDF → AI Memory</strong><span>Indexation en un clic</span></span>
          </div>
        </div>
      </div>

      <div className="feature-bar">
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CD1C18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></svg>Recherche vectorielle</span>
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>Données chiffrées</span>
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2z" /></svg>Fichiers PDF</span>
        <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 0 1 0 18" /><path d="M12 3a15 15 0 0 0 0 18" /></svg>Multi-langues</span>
      </div>
    </div>
  );
}
