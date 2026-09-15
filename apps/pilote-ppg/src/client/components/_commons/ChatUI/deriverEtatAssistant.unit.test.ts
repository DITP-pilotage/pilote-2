import { deriverEtatAssistant } from "@/components/_commons/ChatUI/deriverEtatAssistant";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

const message = (parts: PiloteUIMessage["parts"]): PiloteUIMessage => ({
  id: "message-1",
  role: "assistant",
  parts,
});

describe("deriverEtatAssistant", () => {
  test("réfléchit tant que la requête est soumise sans réponse", () => {
    // Given / When
    const etat = deriverEtatAssistant({
      message: undefined,
      status: "submitted",
    });

    // Then
    expect(etat).toBe("reflechit");
  });

  test("aucun état quand la conversation est prête", () => {
    // Given
    const dernier = message([{ type: "text", text: "Voilà." }]);

    // When
    const etat = deriverEtatAssistant({ message: dernier, status: "ready" });

    // Then
    expect(etat).toBeNull();
  });

  test("consulte les sources quand un outil de données est en cours", () => {
    // Given
    const dernier = message([
      {
        type: "tool-get_chantiers",
        toolCallId: "appel-1",
        state: "input-available",
        input: { territoire_code: "BRE" },
      },
    ] as PiloteUIMessage["parts"]);

    // When
    const etat = deriverEtatAssistant({
      message: dernier,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("consulte-les-sources");
  });

  test("réfléchit entre deux étapes, une fois les sources reçues", () => {
    // Given
    const dernier = message([
      {
        type: "tool-get_chantiers",
        toolCallId: "appel-1",
        state: "output-available",
        input: {},
        output: {},
      },
    ] as PiloteUIMessage["parts"]);

    // When
    const etat = deriverEtatAssistant({
      message: dernier,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("reflechit");
  });

  test("rédige quand du texte arrive", () => {
    // Given
    const dernier = message([{ type: "text", text: "Au jalon 3," }]);

    // When
    const etat = deriverEtatAssistant({
      message: dernier,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("redige");
  });

  test("réfléchit quand le bloc de texte est ouvert mais encore vide", () => {
    // Given
    const dernier = message([{ type: "text", text: "" }]);

    // When
    const etat = deriverEtatAssistant({
      message: dernier,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("reflechit");
  });

  test("compose le tableau de bord pendant create_dashboard", () => {
    // Given
    const dernier = message([
      {
        type: "tool-create_dashboard",
        toolCallId: "appel-2",
        state: "input-streaming",
        input: {},
      },
    ] as PiloteUIMessage["parts"]);

    // When
    const etat = deriverEtatAssistant({
      message: dernier,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("compose-le-tableau-de-bord");
  });

  test("génère le rapport pendant export_rapport", () => {
    // Given
    const dernier = message([
      {
        type: "tool-export_rapport",
        toolCallId: "appel-3",
        state: "input-available",
        input: { format: "pdf" },
      },
    ] as PiloteUIMessage["parts"]);

    // When
    const etat = deriverEtatAssistant({
      message: dernier,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("genere-le-rapport");
  });
});
