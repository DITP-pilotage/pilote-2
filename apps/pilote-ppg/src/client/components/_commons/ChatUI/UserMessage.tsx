import { memo } from "react";
import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { extractMessageText } from "@/components/_commons/ChatUI/utils";

export const UserMessage = memo(function UserMessage({
  message,
}: {
  message: PiloteUIMessage;
}) {
  return (
    <div className="max-w-[560px] whitespace-pre-wrap bg-dsfr-blue-france-950 px-4 py-3 text-[15px] leading-6 text-dsfr-grey-50">
      {extractMessageText(message)}
    </div>
  );
});
