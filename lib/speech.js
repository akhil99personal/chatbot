// Browser-native TTS via SpeechSynthesis with smart natural/online voice mapping.

let currentId = null;
const listeners = new Set();
const notify = () => listeners.forEach((cb) => cb());

export const subscribeTts = (cb) => { listeners.add(cb); return () => listeners.delete(cb); };
export const isSpeaking = (id) => currentId === id && window.speechSynthesis?.speaking;

function getVoiceForText(text, voices) {
  if (!voices || voices.length === 0) return null;

  const isDevanagari = /[\u0900-\u097F]/.test(text);
  const isTelugu = /[\u0C00-\u0C7F]/.test(text);
  const isKannada = /[\u0C80-\u0CFF]/.test(text);

  let langRegex;
  if (isDevanagari) {
    langRegex = /hi-IN|mr-IN/i;
  } else if (isTelugu) {
    langRegex = /te-IN/i;
  } else if (isKannada) {
    langRegex = /kn-IN/i;
  } else {
    langRegex = /en-IN|en-GB|en-US/i;
  }

  // 1. Prioritize a natural/online/google voice matching the detected language
  let voice = voices.find((v) => langRegex.test(v.lang) && /natural|online|google/i.test(v.name));
  
  // 2. Try any voice matching the language
  if (!voice) {
    voice = voices.find((v) => langRegex.test(v.lang));
  }

  // 3. Fallback to any natural/online/google English voice
  if (!voice) {
    voice = voices.find((v) => /en-IN|en-GB|en-US/i.test(v.lang) && /natural|online|google/i.test(v.name));
  }

  // 4. Fallback to any English voice
  if (!voice) {
    voice = voices.find((v) => /en-IN|en-GB|en-US/i.test(v.lang));
  }

  // 5. Ultimate fallback
  if (!voice) {
    voice = voices[0];
  }

  return voice;
}

export function speak(id, text) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (isSpeaking(id)) { stopSpeaking(); return; }
  stopSpeaking();

  // Strip code fences & json cards for cleaner TTS output
  const clean = String(text)
    .replace(/```json[\s\S]*?```/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[*_#`>]/g, "")
    .trim();
  if (!clean) return;

  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 1.0; 
  u.pitch = 1.0; 
  u.volume = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = getVoiceForText(clean, voices);
  if (selectedVoice) {
    u.voice = selectedVoice;
    u.lang = selectedVoice.lang;
  }

  u.onend = () => { currentId = null; notify(); };
  u.onerror = u.onend;
  currentId = id;
  window.speechSynthesis.speak(u);
  notify();
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
  currentId = null;
  notify();
}

// Parse fenced ```json {"card":"..."} ``` blocks out of a markdown string.
// Returns { segments: [{type:'text',content} | {type:'card',data}] }
export function parseCards(markdown) {
  const segments = [];
  const re = /```json\s*([\s\S]*?)```/g;
  let last = 0; let m;
  while ((m = re.exec(markdown)) !== null) {
    if (m.index > last) segments.push({ type: "text", content: markdown.slice(last, m.index) });
    try {
      const data = JSON.parse(m[1]);
      if (data && typeof data === "object" && data.card) segments.push({ type: "card", data });
      else segments.push({ type: "text", content: m[0] });
    } catch {
      segments.push({ type: "text", content: m[0] });
    }
    last = re.lastIndex;
  }
  if (last < markdown.length) segments.push({ type: "text", content: markdown.slice(last) });
  return segments.filter((s) => s.type !== "text" || s.content.trim());
}
