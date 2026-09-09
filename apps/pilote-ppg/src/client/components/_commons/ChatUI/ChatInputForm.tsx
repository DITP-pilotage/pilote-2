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
import { StopIcon } from "@/components/_commons/Icones/StopIcon";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";
import { useSpeechRecognition } from "@/components/_commons/ChatUI/useSpeechRecognition";
import { Select } from "@/components/shared/Select";
import { ChatAssistantDisclaimer } from "@/components/_commons/ChatUI/ChatAssistantDisclaimer";

export type AlbertModel = "openweight-medium" | "openweight-large";

const MODEL_OPTIONS: { libelle: string; valeur: AlbertModel }[] = [
  { libelle: "GPT-OSS 120B", valeur: "openweight-large" },
  { libelle: "Mistral Small 24B", valeur: "openweight-medium" },
];

const HAUTEUR_MAX_SAISIE_PX = 200;

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
  const { sendMessage, status, stop } = useChatContext();
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

  // La zone de saisie grandit avec le texte, jusqu'à une hauteur plafond.
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, HAUTEUR_MAX_SAISIE_PX)}px`;
  }, [input]);

  const handleTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const {
    state: micState,
    isSupported,
    toggle: toggleMic,
    stop: stopMic,
  } = useSpeechRecognition({ onTranscript: handleTranscript });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isBusy) return;

    stopMic();
    setInput("");
    sendMessage({ text: trimmedInput });
  };

  return (
    <div className="shrink-0 border-t border-dsfr-grey-925 bg-white px-4 pb-3 pt-3">
      <form
        className={clsxm(
          "mx-auto flex max-w-3xl flex-col border bg-white transition-colors",
          isBusy
            ? "border-dsfr-grey-900 bg-dsfr-grey-1000"
            : "border-dsfr-grey-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary",
        )}
        onSubmit={handleSubmit}
      >
        <textarea
          className="w-full resize-none border-0 bg-transparent px-4 pb-1 pt-3 text-[15px] leading-6 text-dsfr-grey-50 placeholder:text-dsfr-grey-625 focus:outline-none focus:ring-0 disabled:cursor-not-allowed"
          disabled={isBusy}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit(event);
            }
          }}
          placeholder={isBusy ? "Albert prépare sa réponse…" : placeholder}
          ref={textareaRef}
          rows={1}
          value={input}
        />
        <div className="flex items-center justify-between px-1.5 pb-1.5 pt-1">
          <div className="flex items-center gap-0.5">
            <Select.Root
              disabled={isBusy}
              onValueChange={(model) => {
                setSelectedModel(model as AlbertModel);
                onModelChange(model as AlbertModel);
              }}
              value={selectedModel}
            >
              <Select.GhostButtonTrigger className="h-7 rounded-none px-2 text-xs font-medium text-dsfr-mention-grey hover:bg-dsfr-grey-1000 hover:text-dsfr-grey-50 data-[state=open]:bg-dsfr-grey-1000">
                <Select.Value />
              </Select.GhostButtonTrigger>
              <Select.Content>
                {MODEL_OPTIONS.map((option) => (
                  <Select.Item key={option.valeur} value={option.valeur}>
                    {option.libelle}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            {isSupported && (
              <button
                aria-label={
                  micState === "listening"
                    ? "Arrêter l'écoute"
                    : "Dicter un message"
                }
                className={clsxm(
                  "flex h-7 w-7 items-center justify-center transition-colors",
                  {
                    "text-dsfr-mention-grey hover:bg-dsfr-grey-1000 hover:text-dsfr-grey-50":
                      !isBusy && micState === "inactive",
                    "bg-error text-white animate-pulse-recording":
                      micState === "listening",
                    "cursor-not-allowed text-dsfr-grey-625": isBusy,
                  },
                )}
                disabled={isBusy}
                onClick={toggleMic}
                title="Dicter"
                type="button"
              >
                <MicrophoneIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          {isBusy ? (
            <button
              aria-label="Arrêter la génération"
              className="inline-flex h-8 items-center gap-2 bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-dsfr-blue-france-sun-113-hover"
              onClick={stop}
              type="button"
            >
              <StopIcon className="h-4 w-4" />
              Arrêter
            </button>
          ) : (
            <button
              aria-label="Envoyer le message"
              className="flex h-8 w-8 items-center justify-center bg-primary text-white transition-colors hover:bg-dsfr-blue-france-sun-113-hover disabled:cursor-not-allowed disabled:bg-dsfr-grey-900"
              disabled={!input.trim()}
              type="submit"
            >
              <ArrowLineIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>
      <ChatAssistantDisclaimer />
    </div>
  );
};
