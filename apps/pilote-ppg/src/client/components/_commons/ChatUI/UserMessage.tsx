import { memo } from "react";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { extractMessageText } from "@/components/_commons/ChatUI/utils";

export const UserMessage = memo(function UserMessage({
  message,
}: {
  message: PiloteUIMessage;
}) {
  return (
    <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3 text-sm whitespace-pre-wrap bg-primary text-white">
      {extractMessageText(message)}
    </div>
  );
});
