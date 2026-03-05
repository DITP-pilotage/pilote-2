import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionState = "inactive" | "listening";

type UseSpeechRecognitionReturn = {
  state: SpeechRecognitionState;
  isSupported: boolean;
  toggle: () => void;
};

export const useSpeechRecognition = ({
  onTranscript,
  lang = "fr-FR",
}: {
  onTranscript: (text: string) => void;
  lang?: string;
}): UseSpeechRecognitionReturn => {
  const isSupported =
    typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const [state, setState] = useState<SpeechRecognitionState>("inactive");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;

    if (state === "listening") {
      recognitionRef.current?.stop();
      setState("inactive");
      return;
    }

    if (!recognitionRef.current) {
      const SpeechRecognitionConstructor =
        window.SpeechRecognition ?? window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor!();
      recognition.lang = lang;
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            const transcript = result[0].transcript;
            onTranscriptRef.current(transcript);
          }
        }
      };

      recognition.onerror = () => {
        setState("inactive");
      };

      recognition.onend = () => {
        setState("inactive");
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.start();
    setState("listening");
  }, [isSupported, lang, state]);

  return { state, isSupported, toggle };
};
