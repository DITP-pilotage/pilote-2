import { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export const extractMessageText = (message: PiloteUIMessage): string => {
  if (!message.parts) return "";
  return message.parts
    .map((part) => {
      if (part.type === "text") {
        return part.text;
      }
      return "";
    })
    .join("");
};
