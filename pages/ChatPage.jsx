import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, MessageSquarePlus, X } from "lucide-react";
import Sidebar from "../components/Sidebar.jsx";
import ChatView from "../components/ChatView.jsx";
import Logo from "../components/Logo.jsx";
import { loadThreads, makeThread, saveThreads } from "../lib/threads.js";
import "../chatbot-index.css";

export default function ChatPage({ threadId }) {
  const [openMobile, setOpenMobile] = useState(false);
  const navigate = useNavigate();

  function newChat() {
    const t = makeThread();
    saveThreads([t, ...loadThreads()]);
    setOpenMobile(false);
    navigate(`/milestono-ai/c/${t.id}`);
  }

  return (
    <div className="cb-page">
      {/* Desktop sidebar */}
      <div className="cb-sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {openMobile && (
        <>
          <div className="cb-drawer-overlay" onClick={() => setOpenMobile(false)} />
          <div className="cb-drawer">
            <button
              onClick={() => setOpenMobile(false)} aria-label="Close menu"
              className="cb-drawer-close"
            >
              <X className="h-4 w-4" />
            </button>
            <Sidebar onNavigate={() => setOpenMobile(false)} />
          </div>
        </>
      )}

      <main className="cb-main">
        <header className="cb-mobile-header">
          <button
            onClick={() => setOpenMobile(true)} aria-label="Open menu"
            className="cb-icon-btn"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size={28} />
          <button
            onClick={newChat} aria-label="New chat"
            className="cb-icon-btn"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </button>
        </header>
        <ChatView threadId={threadId} />
      </main>
    </div>
  );
}