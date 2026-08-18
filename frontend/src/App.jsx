import { useState, useEffect } from "react";
import * as api from "./api";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Profile from "./components/Profile";
import Dashboard from "./components/Dashboard";
import ChatScreen from "./components/ChatScreen";
import Publish from "./components/Publish";
import Docs from "./components/Docs";
import "./styles.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(!!api.getToken());
  const [bots, setBots] = useState([]);
  const [botId, setBotId] = useState("");
  const [screen, setScreen] = useState("landing");   // landing | auth
  const [authMode, setAuthMode] = useState("login");
  const [view, setView] = useState("bots");          // bots | profile

  useEffect(() => {
    if (!api.getToken()) return;
    (async () => {
      try {
        setUser(await api.me());
        setBots(await api.listBots());
      } catch {
        api.clearToken();
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function handleAuth(mode, email, password) {
    await (mode === "login" ? api.login : api.register)(email, password);
    setUser(await api.me());
    setBots(await api.listBots());
  }

  function logout() {
    api.clearToken();
    setUser(null);
    setBots([]);
    setBotId("");
    setScreen("landing");
    setView("bots");
  }

  async function createBot(name) {
    const bot = await api.createBot(name);
    setBots((b) => [...b, bot]);
  }

  async function refreshBots() {
    try {
      setBots(await api.listBots());
    } catch {
      /* le prochain rendu réessaiera */
    }
  }

  async function removeBot(id) {
    if (!window.confirm("Supprimer ce bot et toute son AI Memory ? Cette action est définitive.")) return;
    try {
      await api.deleteBot(id);
      if (botId === id) setBotId("");
      await refreshBots();
    } catch (e) {
      if (e.status === 401) logout();
    }
  }

  if (booting) return <div className="boot">Chargement…</div>;

  if (!user) {
    if (screen === "landing") {
      return (
        <Landing
          onLogin={() => { setAuthMode("login"); setScreen("auth"); }}
          onRegister={() => { setAuthMode("register"); setScreen("auth"); }}
        />
      );
    }
    return <Login mode={authMode} onSubmit={handleAuth} />;
  }

  if (botId) {
    return (
      <ChatScreen
        bot={bots.find((b) => b.id === botId)}
        onBack={() => setBotId("")}
        onUploaded={refreshBots}
        onUnauthorized={logout}
      />
    );
  }

  return (
    <Dashboard
      bots={bots}
      view={view}
      onView={setView}
      onOpen={setBotId}
      onCreate={createBot}
      onLogout={logout}
      onUnauthorized={logout}
      profile={<Profile user={user} bots={bots} onDeleteBot={removeBot} />}
      publish={<Publish bots={bots} onUnauthorized={logout} onDocs={() => setView("docs")} />}
      docs={<Docs onPublish={() => setView("publish")} />}
    />
  );
}
