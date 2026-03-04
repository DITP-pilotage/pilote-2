import { FormEvent, useState } from "react";
import { clsxm } from "@/utils/clsxm";
import { ArrowLineIcon } from "@/components/_commons/Icones/ArrowLineIcon";
import { useChatContext } from "@/components/_commons/ChatUI/ChatContext";

export const ChatInputForm = ({ placeholder }: { placeholder: string }) => {
  const [input, setInput] = useState("");
  const { sendMessage, status } = useChatContext();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || status === "submitted" || status === "streaming")
      return;

    setInput("");
    sendMessage({ text: trimmedInput });
  };

  return (
    <div className="shrink-0 border-t border-gray-100 p-4 bg-white">
      <form className="max-w-3xl mx-auto relative" onSubmit={handleSubmit}>
        <textarea
          className="w-full resize-none rounded-xl border border-gray-200 pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={status === "submitted" || status === "streaming"}
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
        <button
          className={clsxm(
            "absolute bottom-4 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            {
              "bg-primary text-white hover:bg-primary/90":
                status !== "submitted" &&
                status !== "streaming" &&
                input.trim(),
              "bg-gray-300 text-white cursor-not-allowed":
                status === "submitted" ||
                status === "streaming" ||
                !input.trim(),
            },
          )}
          disabled={
            status === "submitted" || status === "streaming" || !input.trim()
          }
          type="submit"
        >
          <ArrowLineIcon className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
