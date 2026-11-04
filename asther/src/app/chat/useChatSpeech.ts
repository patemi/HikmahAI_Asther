"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<ArrayLike<{ transcript: string }>>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
const subscribe = () => () => {};
export function useChatSpeech(
  onText: (text: string) => void,
  onError: (text: string) => void,
) {
  const [reading, setReading] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const generation = useRef(0);
  const canDictate = useSyncExternalStore(
    subscribe,
    () =>
      Boolean(
        (window as SpeechWindow).SpeechRecognition ||
          (window as SpeechWindow).webkitSpeechRecognition,
      ),
    () => false,
  );
  useEffect(
    () => () => {
      generation.current++;
      window.speechSynthesis?.cancel();
      recognition.current?.abort();
    },
    [],
  );
  const stopReading = useCallback(() => {
    generation.current++;
    window.speechSynthesis?.cancel();
    setReading(null);
  }, []);
  const stopDictation = useCallback(() => {
    recognition.current?.abort();
    setListening(false);
  }, []);
  useEffect(() => {
    window.addEventListener("popstate", stopDictation);
    window.addEventListener("popstate", stopReading);
    return () => {
      window.removeEventListener("popstate", stopDictation);
      window.removeEventListener("popstate", stopReading);
    };
  }, [stopDictation, stopReading]);
  function read(id: string, text: string) {
    if (!window.speechSynthesis) {
      onError("Browser ini belum mendukung pembacaan suara.");
      return;
    }
    const wasReading = reading === id;
    stopReading();
    if (wasReading) return;
    const version = generation.current;
    const speech = new SpeechSynthesisUtterance(
      text.replace(/[#*_`]/g, "").replace(/\[(\d+)\]/g, ""),
    );
    speech.lang = "id-ID";
    speech.voice =
      window.speechSynthesis
        .getVoices()
        .find((v) => v.lang.toLowerCase().startsWith("id")) || null;
    speech.onend = () => {
      if (version === generation.current) setReading(null);
    };
    speech.onerror = (event) => {
      if (version !== generation.current) return;
      setReading(null);
      if (!["interrupted", "canceled"].includes(event.error))
        onError(
          "Suara belum dapat diputar. Cek dukungan suara di perangkatmu.",
        );
    };
    setReading(id);
    window.speechSynthesis.speak(speech);
  }
  function dictate() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Constructor =
      (window as SpeechWindow).SpeechRecognition ||
      (window as SpeechWindow).webkitSpeechRecognition;
    if (!Constructor) {
      onError("Browser ini belum mendukung dikte suara. Gunakan kolom teks.");
      return;
    }
    stopReading();
    const instance = new Constructor();
    recognition.current = instance;
    instance.lang = "id-ID";
    instance.continuous = false;
    instance.interimResults = false;
    instance.onresult = (event) =>
      onText(
        Array.from(event.results)
          .map((r) => r[0]?.transcript || "")
          .join(" "),
      );
    instance.onerror = (event) => {
      if (event.error !== "aborted")
        onError(
          event.error === "not-allowed"
            ? "Izin mikrofon belum diberikan. Aktifkan izin browser atau ketik pertanyaan."
            : "Dikte belum berhasil. Periksa mikrofon dan koneksi, lalu coba kembali.",
        );
    };
    instance.onend = () => {
      setListening(false);
      recognition.current = null;
    };
    try {
      instance.start();
      setListening(true);
    } catch {
      onError("Mikrofon belum dapat digunakan.");
    }
  }
  return {
    reading,
    read,
    stopReading,
    stopDictation,
    listening,
    dictate,
    canDictate,
  };
}
