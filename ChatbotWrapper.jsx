import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ChatPage from "./pages/ChatPage.jsx";
import { loadThreads, makeThread, saveThreads } from "./lib/threads.js";

export function ChatLanding() {
  const navigate = useNavigate();
  useEffect(() => {
    const all = loadThreads();
    if (all[0]) navigate(`/milestono-ai/c/${all[0].id}`, { replace: true });
    else {
      const t = makeThread();
      saveThreads([t]);
      navigate(`/milestono-ai/c/${t.id}`, { replace: true });
    }
  }, [navigate]);
  return null;
}

export function ThreadRoute() {
  const { threadId } = useParams();
  return <ChatPage key={threadId} threadId={threadId} />;
}
