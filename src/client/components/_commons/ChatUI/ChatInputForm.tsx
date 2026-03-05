import {
  FormEvent,
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { clsxm } from "@/utils/clsxm";
import { ArrowLineIcon } from "@/components/_commons/Icones/ArrowLineIcon";
import { MicrophoneIcon } from "@/components/_commons/Icones/MicrophoneIcon";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";
import { useSpeechRecognition } from "@/components/_commons/ChatUI/useSpeechRecognition";
import { SelecteurNew } from "@/components/_commons/SelecteurNew/SelecteurNew";

export type AlbertModel = "openweight-medium" | "openweight-large";

const MODEL_OPTIONS: { libelle: string; valeur: AlbertModel }[] = [
  { libelle: "GPT-OSS 120B", valeur: "openweight-large" },
  { libelle: "Mistral Small 24B", valeur: "openweight-medium" },
];

export const ChatInputForm = ({
  placeholder,
  fillInputRef,
  onModelChange,
}: {
  placeholder: string;
  fillInputRef: MutableRefObject<((text: string) => void) | null>;
  onModelChange: (model: AlbertModel) => void;
}) => {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] =
    useState<AlbertModel>("openweight-large");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, status } = useChatContext();
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    fillInputRef.current = (text: string) => {
      setInput(text);
      setTimeout(() => {
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(text.length, text.length);
        }
      }, 0);
    };
  }, [fillInputRef]);

  const handleTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const {
    state: micState,
    isSupported,
    toggle: toggleMic,
  } = useSpeechRecognition({ onTranscript: handleTranscript });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isBusy) return;

    setInput("");
    sendMessage({ text: trimmedInput });
  };

  return (
    <div className="shrink-0 border-t border-gray-100 p-4 bg-white">
      <div className="max-w-3xl mx-auto mb-2">
        <SelecteurNew
          disabled={isBusy}
          htmlName="albert-model"
          onChange={(model) => {
            setSelectedModel(model);
            onModelChange(model);
          }}
          options={MODEL_OPTIONS}
          showSearch={false}
          triggerClassName="!w-auto text-xs"
          valeurSelectionnee={selectedModel}
        />
      </div>
      <form className="max-w-3xl mx-auto relative" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="w-full resize-none rounded-xl border border-gray-200 pl-4 pr-20 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={isBusy}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
          placeholder={placeholder}
          rows={2}
          value={input}
        />
        <div className="absolute bottom-4 right-2 flex items-center gap-1">
          {isSupported && (
            <button
              aria-label={
                micState === "listening"
                  ? "Arrêter l'écoute"
                  : "Dicter un message"
              }
              className={clsxm(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                {
                  "text-gray-500 bg-transparent hover:text-gray-700 hover:bg-gray-100":
                    !isBusy && micState === "inactive",
                  "bg-red-500 text-white animate-pulse-recording":
                    micState === "listening",
                  "text-gray-300 cursor-not-allowed": isBusy,
                },
              )}
              disabled={isBusy}
              onClick={toggleMic}
              type="button"
            >
              <MicrophoneIcon className="w-4 h-4" />
            </button>
          )}
          <button
            className={clsxm(
              "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              {
                "bg-primary text-white hover:bg-primary/90":
                  !isBusy && input.trim(),
                "bg-gray-300 text-white cursor-not-allowed":
                  isBusy || !input.trim(),
              },
            )}
            disabled={isBusy || !input.trim()}
            type="submit"
          >
            <ArrowLineIcon className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
