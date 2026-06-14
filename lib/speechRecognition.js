import { useCallback, useEffect, useRef, useState } from "react";

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function useBrowserSpeechRecognition({ language = "en-IN", continuous = true } = {}) {
  const recognitionRef = useRef(null);
  const [supported, setSupported] = useState(() => Boolean(getSpeechRecognition()));
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognition()));
  }, []);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.stop();
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionApi = getSpeechRecognition();
    if (!SpeechRecognitionApi) {
      throw new Error("Speech recognition is not supported in this browser.");
    }

    const existing = recognitionRef.current;
    if (existing) {
      existing.stop();
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onresult = (event) => {
      let nextTranscript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        nextTranscript += event.results[i][0]?.transcript || "";
      }
      setTranscript(nextTranscript.trim());
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [continuous, language]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  return {
    listening,
    resetTranscript,
    startListening,
    stopListening,
    supported,
    transcript,
  };
}
