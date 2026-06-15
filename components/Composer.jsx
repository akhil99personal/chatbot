import { useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, MicOff, Square, Volume2, VolumeX } from "lucide-react";

const STT_LANGS = [
  { code: "en-IN", label: "EN", title: "English" },
  { code: "hi-IN", label: "हिन्दी", title: "Hindi (Hinglish)" },
  { code: "mr-IN", label: "मराठी", title: "Marathi" },
];

export default function Composer({ value, onChange, onSubmit, onStop, isStreaming, autoSpeak, onToggleAutoSpeak, isEmpty = false }) {
  const taRef = useRef(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [sttLang, setSttLang] = useState("en-IN");
  const recognitionRef = useRef(null);
  const baseRef = useRef("");

  useEffect(() => {
    // Initialize Web Speech API if supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sttLang;

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      // Re-assemble the text
      const newText = (baseRef.current ? baseRef.current.trim() + " " : "") + finalTranscript + interimTranscript;
      onChange(newText);

      // If a segment finalized, append it to baseRef
      if (finalTranscript) {
        baseRef.current = (baseRef.current ? baseRef.current.trim() + " " : "") + finalTranscript;
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    // If it was already listening, start the new recognition instance
    if (listening) {
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start SpeechRecognition after language swap:", e);
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, sttLang]);

  useEffect(() => {
    const el = taRef.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  function toggleMic() {
    if (!supported || !recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    baseRef.current = value || "";
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
    }
  }

  function cycleLang() {
    const nextIdx = (STT_LANGS.findIndex((l) => l.code === sttLang) + 1) % STT_LANGS.length;
    const nextLang = STT_LANGS[nextIdx].code;
    setSttLang(nextLang);
  }

  const currentLangObj = STT_LANGS.find((l) => l.code === sttLang) || STT_LANGS[0];

  function handleSubmit(e) {
    e?.preventDefault();
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
    if (!value.trim() || isStreaming) return;
    onSubmit();
  }

  if (isEmpty) {
    // Welcome screen input with action buttons
    return (
      <div className="cb-composer">
        <div className="cb-welcome-input">
          <div className="cb-input-actions">
            <button onClick={() => onSubmit("Search for properties around me")} className="cb-action-btn">
              <span className="cb-action-btn-icon">🏠</span>
              Nearby Properties
            </button>
            <button onClick={() => onSubmit("Calculate EMI for a property")} className="cb-action-btn">
              <span className="cb-action-btn-icon">💰</span>
              EMI Calculator
            </button>
            <button onClick={() => onSubmit("Compare properties")} className="cb-action-btn">
              <span className="cb-action-btn-icon">⚖️</span>
              Compare
            </button>
          </div>
          <form onSubmit={handleSubmit} className="cb-composer-form">
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
              }}
              placeholder="Initiate a query or send a command to the AI..."
              rows={1}
            />
            {isStreaming ? (
              <button type="button" onClick={onStop} aria-label="Stop generating" className="cb-composer-btn cb-composer-stop">
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button type="submit" disabled={!value.trim()} aria-label="Send" className="cb-composer-btn cb-composer-send">
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Chat mode input (ChatGPT style)
  return (
    <div className="cb-composer">
      <form onSubmit={handleSubmit} className="cb-composer-form">
        <button
          type="button"
          onClick={toggleMic}
          disabled={!supported}
          aria-label={listening ? "Stop recording" : "Start voice input"}
          title={!supported ? "Speech recognition not supported" : (listening ? "Listening…" : "Voice input")}
          className={`cb-composer-btn cb-composer-mic ${listening ? "listening" : ""}`}
        >
          {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </button>

        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
          }}
          placeholder={listening ? "Listening…" : "Ask about properties, EMIs, documents…"}
          rows={1}
        />

        {isStreaming ? (
          <button type="button" onClick={onStop} aria-label="Stop" className="cb-composer-btn cb-composer-stop">
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button type="submit" disabled={!value.trim()} aria-label="Send" className="cb-composer-btn cb-composer-send">
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
}
