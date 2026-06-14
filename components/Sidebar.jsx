import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MessageSquarePlus, Trash2, LogIn, LogOut, User } from "lucide-react";
import { loadThreads, makeThread, saveThreads } from "../lib/threads.js";
import { isLoggedIn, getUserProfile } from "../lib/api.js";
import Logo from "./Logo.jsx";

export default function Sidebar({ onNavigate }) {
  const [threads, setThreads] = useState(() => loadThreads());
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();
  const { threadId } = useParams();

  useEffect(() => {
    const refresh = () => setThreads(loadThreads());
    window.addEventListener("milestono:threads-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("milestono:threads-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Check auth and fetch user profile
  useEffect(() => {
    const checkAuth = async () => {
      const auth = isLoggedIn();
      setLoggedIn(auth);
      if (auth) {
        const profile = await getUserProfile();
        setUserProfile(profile);
      }
    };
    checkAuth();
  }, []);

  function newChat() {
    const t = makeThread();
    saveThreads([t, ...loadThreads()]);
    onNavigate?.();
    navigate(`/milestono-ai/c/${t.id}`);
  }
  function remove(id, e) {
    e.preventDefault(); e.stopPropagation();
    const next = loadThreads().filter((t) => t.id !== id);
    saveThreads(next);
    if (id === threadId) {
      if (next[0]) navigate(`/milestono-ai/c/${next[0].id}`);
      else newChat();
    }
  }

  function handleLogin() {
    // Store current path to redirect back after login
    sessionStorage.setItem("loginRedirect", window.location.pathname);
    navigate("/login?redirect=" + encodeURIComponent(window.location.pathname));
  }

  function handleLogout() {
    localStorage.removeItem("auth");
    localStorage.removeItem("user_id");
    setLoggedIn(false);
    setUserProfile(null);
    window.dispatchEvent(new Event("storage"));
  }

  const userName = userProfile?.fullName || userProfile?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="cb-sidebar">
      <div className="cb-sidebar-top">
        <div className="cb-sidebar-title">
          <Logo size={28} />
          <span>Milestono</span>
        </div>
      </div>
      <button onClick={newChat} className="cb-new-chat-btn">
        <MessageSquarePlus className="h-4 w-4" />
        New chat
      </button>
      <div className="cb-sidebar-label">Recent</div>
      <nav className="cb-thread-list">
        {threads.length === 0 ? (
          <div className="cb-thread-list-empty">No conversations yet.</div>
        ) : threads.map((t) => {
          const active = t.id === threadId;
          return (
            <Link
              key={t.id} to={`/milestono-ai/c/${t.id}`} onClick={onNavigate}
              className={`cb-thread-link ${active ? "active" : ""}`}
            >
              <span className="cb-thread-title">{t.title}</span>
              <button
                onClick={(e) => remove(t.id, e)}
                className="cb-thread-delete" aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="cb-sidebar-user">
        {loggedIn ? (
          <>
            <div className="cb-sidebar-user-card">
              <div className="cb-sidebar-user-avatar">
                {userProfile?.profileImage ? (
                  <img src={userProfile.profileImage} alt={userName} />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              <div className="cb-sidebar-user-info">
                <span className="cb-sidebar-user-name">{userName}</span>
                <span className="cb-sidebar-user-email">{userProfile?.email || ""}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="cb-sidebar-logout-btn" title="Logout">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        ) : (
          <button onClick={handleLogin} className="cb-sidebar-login-btn">
            <LogIn className="h-4 w-4" />
            Login for personalized features
          </button>
        )}
      </div>

      <div className="cb-sidebar-footer">
        Local history · Gemini powered
      </div>
    </aside>
  );
}