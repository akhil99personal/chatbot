const KEY = "milestono:threads:v2";

export function loadThreads() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function pruneThreads(threads) {
  // 1. Keep only the most recent 12 threads
  let pruned = [...threads];
  pruned.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  pruned = pruned.slice(0, 12);
  
  // 2. For each thread, keep only the last 30 messages, and strip base64/massive content
  return pruned.map(t => {
    let msgs = t.messages || [];
    if (msgs.length > 30) {
      msgs = msgs.slice(-30);
    }
    
    msgs = msgs.map(msg => {
      if (!msg || typeof msg.content !== "string") return msg;
      
      let cleanContent = msg.content;
      if (cleanContent.includes("data:image")) {
        // Replace all base64 data URIs with a 1x1 transparent gif to save space
        cleanContent = cleanContent.replace(/data:image\/[a-zA-Z+.-]+;base64,[a-zA-Z0-9+/=\s\n\r]+/g, "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
      }
      return { ...msg, content: cleanContent };
    });
    
    return { ...t, messages: msgs };
  });
}

export function saveThreads(threads) {
  const pruned = pruneThreads(threads);
  try {
    localStorage.setItem(KEY, JSON.stringify(pruned));
  } catch (e) {
    console.error("Failed to save threads to localStorage:", e);
    // If it still fails (e.g. browser quota is completely full from other things),
    // let's try an even more aggressive prune (e.g. keep only 3 threads)
    try {
      const superPruned = pruned.slice(0, 3);
      localStorage.setItem(KEY, JSON.stringify(superPruned));
    } catch (e2) {
      console.error("Super pruning also failed:", e2);
    }
  }
  window.dispatchEvent(new Event("milestono:threads-updated"));
}

function id() {
  return Math.random().toString(36).slice(2, 14);
}

export function makeThread(idOverride) {
  return { id: idOverride || id(), title: "New chat", updatedAt: Date.now(), messages: [] };
}

export function upsertThread(threadId, messages) {
  const all = loadThreads();
  const i = all.findIndex((t) => t.id === threadId);
  const title = deriveTitle(messages);
  const t = { id: threadId, title, updatedAt: Date.now(), messages };
  if (i >= 0) all[i] = t; else all.unshift(t);
  saveThreads(all);
}

export function deriveTitle(messages) {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const txt = String(first.content || "").replace(/\s+/g, " ").trim();
  return txt.length > 48 ? txt.slice(0, 48) + "…" : txt || "New chat";
}