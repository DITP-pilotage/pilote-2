import { texteEncarts } from "@/components/_commons/ChatUI/texteEncarts";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

describe("texteEncarts", () => {
  test("renvoie le texte des encarts rédigés, sans ceux dont l'accès est refusé", () => {
    // Given
    const message: PiloteUIMessage = {
      id: "message-1",
      role: "assistant",
      parts: [
        {
          type: "tool-rediger_synthese_territoire",
          toolCallId: "appel-1",
          state: "output-available",
          input: { territoire_code: "DEPT-59", jalon: 2025 },
          output: {
            type: "synthese",
            jalon: 2025,
            date_redaction: "2026-10-27",
            markdown: "# Synthèse pour le Nord",
            termine: true,
          },
        },
        {
          type: "tool-rediger_comparaison_territoires",
          toolCallId: "appel-2",
          state: "output-available",
          input: { territoire_codes: ["DEPT-59", "DEPT-33"], jalon: 2025 },
          output: {
            type: "comparaison",
            jalon: 2025,
            date_redaction: "2026-10-27",
            markdown: "",
            termine: true,
            acces_refuse: true,
          },
        },
        { type: "text", text: "Voici la synthèse du Nord." },
      ],
    };

    // When
    const textes = texteEncarts({ message });

    // Then
    expect(textes).toEqual(["# Synthèse pour le Nord"]);
  });
});
