import { useState } from "react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import Logo from "./Logo";

export default function Login({ onSubmit, mode: initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const card = useRef(null);
  const isLogin = mode === "login";

  useEffect(() => {
    gsap.fromTo(card.current, { y: 26, opacity: 0, scale: 0.985 }, { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: "power3.out" });
    gsap.fromTo(card.current.children, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, delay: 0.12, ease: "power2.out" });
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(mode, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" ref={card} onSubmit={submit}>
        <div className="login-head">
          <Logo size={54} />
          <h1 className="wordmark wordmark-lg">Docu<span>Mind</span></h1>
          <p>{isLogin ? "Connectez-vous à votre compte" : "Créez votre compte"}</p>
        </div>

        <label className="field">
          <span className="field-label">Email</span>
          <span className="input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" />
            </svg>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </span>
        </label>

        <label className="field">
          <span className="field-label row-between">
            Mot de passe
            <a href="#">Mot de passe oublié ?</a>
          </span>
          <span className="input-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <input
              type="password"
              required
              minLength={isLogin ? undefined : 10}
              maxLength={isLogin ? 128 : 72}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder={isLogin ? "Votre mot de passe" : "10 caractères minimum"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </span>
        </label>

        {error && <p className="error">{error}</p>}

        <button className="dm-btn block" type="submit" disabled={busy}>
          {busy ? "…" : isLogin ? "Se connecter" : "Créer mon compte"}
        </button>

        <p className="switch">
          {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
          <button type="button" onClick={() => { setMode(isLogin ? "register" : "login"); setError(""); }}>
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </form>
    </div>
  );
}
