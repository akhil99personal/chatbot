import { useEffect, useRef, useState } from "react";
import {
  streamChat,
  isLoggedIn,
  getUserProfile,
  getCurrentPosition,
  searchNearbyProperties,
  searchPropertiesByCity,
  isNearbyPropertyQuery,
  isCityPropertyQuery,
  extractCityFromQuery,
  formatNearbyPropertyResponse,
  formatCityPropertyResponse,
  getChatSearchStatusMessage,
  formatChatError,
} from "../lib/api.js";
import { expandMessageWithPropertyCodes } from "../lib/propertyCodes.js";
import {
  isCompareQuery,
  isDirectionsQuery,
  isPropertiesMapQuery,
  handleCompareByCodes,
  handleDirections,
  handlePropertiesMap,
} from "../lib/chatActions.js";
import { upsertThread, loadThreads, makeThread, saveThreads } from "../lib/threads.js";
import MessageRow, { AssistantTyping } from "./Message.jsx";
import Composer from "./Composer.jsx";
import WelcomePro from "./WelcomePro.jsx";
import { speak } from "../lib/speech.js";

function newId() { return Math.random().toString(36).slice(2, 12); }

function loadInitial(threadId) {
  const all = loadThreads();
  const t = all.find((x) => x.id === threadId);
  if (t) return t.messages;
  const fresh = makeThread(threadId);
  saveThreads([fresh, ...all]);
  return [];
}

export default function ChatView({ threadId }) {
  const [messages, setMessages] = useState(() => loadInitial(threadId));
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [userProfile, setUserProfile] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

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

    const onStorage = () => {
      const auth = isLoggedIn();
      setLoggedIn(auth);
      if (!auth) setUserProfile(null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setMessages(loadInitial(threadId));
  }, [threadId]);

  useEffect(() => {
    if (messages.length > 0) upsertThread(threadId, messages);
  }, [messages, threadId]);

  useEffect(() => {
    const el = scrollRef.current; if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, searchStatus]);

  async function send(text) {
    if (!text.trim() || streaming) return;

    setStreaming(true);
    setThinking(true);
    setSearchStatus(getChatSearchStatusMessage(text));
    setInput("");

    const userMsg = { id: newId(), role: "user", content: text };
    const aiId = newId();
    const finalContent = text;

    const finishWithReply = (content) => {
      setMessages([...messages, userMsg, { id: aiId, role: "assistant", content }]);
      setStreaming(false);
      setThinking(false);
      setSearchStatus("");
    };

    try {
      if (isCompareQuery(text)) {
        setSearchStatus("Comparing properties for you…");
        const result = await handleCompareByCodes(text);
        if (result) { finishWithReply(result); return; }
      }

      if (isDirectionsQuery(text)) {
        setSearchStatus("Calculating route to property…");
        const result = await handleDirections(text, getCurrentPosition);
        if (result) { finishWithReply(result); return; }
      }

      if (isPropertiesMapQuery(text)) {
        setSearchStatus("Loading property map…");
        const result = await handlePropertiesMap(text);
        if (result) { finishWithReply(result); return; }
      }

      if (isNearbyPropertyQuery(text)) {
        setSearchStatus("Finding properties near you…");
        const pos = await getCurrentPosition({ timeout: 10000, enableHighAccuracy: true });
        const { latitude, longitude } = pos.coords;
        const properties = await searchNearbyProperties({ latitude, longitude, radiusKm: 5 });
        finishWithReply(formatNearbyPropertyResponse({ latitude, longitude, properties, radiusKm: 5 }));
        return;
      }

      if (isCityPropertyQuery(text)) {
        const city = extractCityFromQuery(text);
        setSearchStatus(`Searching all properties in ${city}…`);
        const properties = await searchPropertiesByCity(city);
        finishWithReply(formatCityPropertyResponse({ city, properties }));
        return;
      }

      const isPostedQuery = /my\s*(?:posted\s*)?properties|posted\s*properties|list\s*my\s*properties/i.test(text);
      const isRecentQuery = /recently\s*viewed|recent\s*properties|my\s*recent/i.test(text);
      const isSavedQuery = /my\s*saved|saved\s*properties|list\s*saved|shortlisted/i.test(text);
      const isContactedQuery = /my\s*contacted|contacted\s*properties|list\s*contacted/i.test(text);

      if (isPostedQuery || isRecentQuery || isSavedQuery || isContactedQuery) {
        setSearchStatus("Loading your properties…");
        const token = localStorage.getItem("auth");
        if (!token) {
          finishWithReply("Please **log in** to view your dashboard properties.");
          return;
        }

        let url = "";
        let intro = "";
        let extractField = null;

        if (isPostedQuery) {
          url = `${process.env.REACT_APP_BASE_URL}/api/shared-property`;
          intro = "Your posted properties:";
          extractField = "properties";
        } else if (isRecentQuery) {
          url = `${process.env.REACT_APP_BASE_URL}/api/get-recent-property`;
          intro = "Your recently viewed properties:";
        } else if (isSavedQuery) {
          url = `${process.env.REACT_APP_BASE_URL}/api/saved-property`;
          intro = "Your shortlisted/saved properties:";
        } else if (isContactedQuery) {
          url = `${process.env.REACT_APP_BASE_URL}/api/unlocked-property`;
          intro = "Your contacted properties:";
        }

        const response = await fetch(url, { headers: { Authorization: token } });
        if (!response.ok) throw new Error(`Failed to load properties (${response.status})`);
        let data = await response.json();

        if (extractField && data && data[extractField]) {
          data = data[extractField];
        }

        const items = Array.isArray(data) ? data : [];

        finishWithReply(`\`\`\`json\n${JSON.stringify({
          card: "properties",
          intro: intro,
          items: items,
          totalCount: items.length,
          hasMore: false,
        })}\n\`\`\``);
        return;
      }
    } catch (err) {
      console.error("Chat action error:", err);
      finishWithReply(`⚠️ ${formatChatError(err)}`);
      return;
    }

    const aiPayloadMsg = { ...userMsg, content: expandMessageWithPropertyCodes(finalContent) };
    const next = [...messages, userMsg];
    const payload = [...next, aiPayloadMsg].map(({ role, content }) => ({ role, content }));

    setMessages(next);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let fullText = "";
      await streamChat({
        messages: payload,
        signal: controller.signal,
        onChunk: (full) => {
          fullText = full;
        },
      });

      setThinking(false);
      setSearchStatus("");
      setMessages((m) => [...m, { id: aiId, role: "assistant", content: fullText }]);

      if (autoSpeak && fullText) {
        speak(aiId, fullText);
      }
    } catch (err) {
      setThinking(false);
      setSearchStatus("");
      if (err.name !== "AbortError") {
        setMessages((m) => [
          ...m,
          { id: aiId, role: "assistant", content: `⚠️ ${formatChatError(err)}` },
        ]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
    setThinking(false);
    setSearchStatus("");
  }

  const isEmpty = messages.length === 0;

  const userName = userProfile?.fullName || userProfile?.name || "User";

  return (
    <div className="cb-chat-wrap">
      {!isEmpty && (
        <div className="cb-navbar">
          <div className="cb-navbar-left">
            <div className="cb-model-selector">
              <span style={{ width: '16px', height: '16px', background: '#10a37f', borderRadius: '4px' }} />
              Milestono AI 4o
              <span style={{ fontSize: '10px', marginLeft: '4px' }}>▼</span>
            </div>
          </div>
          <div className="cb-navbar-right">
            <button className="cb-navbar-btn" title="Settings">⚙️</button>
          </div>
        </div>
      )}
      <div ref={scrollRef} className="cb-scroll">
        {isEmpty ? (
          <div className="cb-welcome-center" style={{ minHeight: "100%" }}>
            <WelcomePro
              onPick={(p) => send(p)}
              isLoggedIn={loggedIn}
              userName={userName}
            />
          </div>
        ) : (
          <div className="cb-messages">
            {messages.map((m) => <MessageRow key={m.id} message={m} userName={userName} />)}
            {thinking && <AssistantTyping message={searchStatus} />}
          </div>
        )}
      </div>
      <div className="cb-composer-wrap">
        <Composer
          value={input} onChange={setInput}
          onSubmit={() => send(input)} onStop={stop}
          isStreaming={streaming}
          autoSpeak={autoSpeak}
          onToggleAutoSpeak={() => setAutoSpeak((v) => !v)}
          isEmpty={isEmpty}
        />
      </div>
    </div>
  );
}
