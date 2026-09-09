import { describe, expect, test } from "vitest";
import { extractMessageText } from "@/server/albert/piloteUIMessageUtils";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

describe("extractMessageText", () => {
  test("concatène uniquement les parties de type texte, dans l'ordre", () => {
    const message = {
      id: "msg-1",
      role: "assistant",
      parts: [
        { type: "text", text: "Bonjour " },
        { type: "tool-get_chantiers", state: "output-available" },
        { type: "text", text: "le monde" },
      ],
    } as unknown as PiloteUIMessage;

    expect(extractMessageText(message)).toBe("Bonjour le monde");
  });

  test("retourne une chaîne vide si le message n'a pas de parties", () => {
    const message = { id: "msg-2", role: "assistant" } as PiloteUIMessage;

    expect(extractMessageText(message)).toBe("");
  });
});
