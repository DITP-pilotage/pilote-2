import {
  afficherAttenteReponse,
  deriverEtatAssistant,
} from "@/components/_commons/ChatUI/deriverEtatAssistant";
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
        input: { perimetre: { type: "TOUTES_REGIONS" } },
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

  test("rédige la synthèse quand un encart est en cours", () => {
    // Given
    const enCours = message([
      {
        type: "tool-rediger_synthese_territoire",
        toolCallId: "appel-1",
        state: "input-available",
        input: { territoire_code: "DEPT-59", jalon: 2025 },
      },
    ]);

    // When
    const etat = deriverEtatAssistant({
      message: enCours,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("redige-l-encart");
  });

  test("rédige la synthèse pendant que l'encart se remplit", () => {
    // Given
    const enCours = message([
      {
        type: "tool-rediger_synthese_territoire",
        toolCallId: "appel-1",
        state: "output-available",
        preliminary: true,
        input: { territoire_code: "DEPT-59", jalon: 2025 },
        output: {
          type: "synthese",
          jalon: 2025,
          date_redaction: "2026-10-27",
          markdown: "# Synthèse",
          termine: false,
        },
      },
    ]);

    // When
    const etat = deriverEtatAssistant({
      message: enCours,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("redige-l-encart");
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

  test("consulte le centre d'aide quand l'outil du centre d'aide est en cours", () => {
    // Given
    const dernier = message([
      {
        type: "tool-consulter_centre_aide",
        toolCallId: "appel-1",
        state: "input-available",
        input: { question: "comment est calculé le taux d'avancement" },
      },
    ]);

    // When
    const etat = deriverEtatAssistant({
      message: dernier,
      status: "streaming",
    });

    // Then
    expect(etat).toBe("consulte-le-centre-d-aide");
  });
});

describe("afficherAttenteReponse", () => {
  const question: PiloteUIMessage = {
    id: "question-1",
    role: "user",
    parts: [{ type: "text", text: "Fais-moi la synthèse du Nord" }],
  };

  test("affiche l'attente tant que la question est la dernière du fil", () => {
    // When
    const affichee = afficherAttenteReponse({
      status: "submitted",
      messages: [question],
    });

    // Then
    expect(affichee).toBe(true);
  });

  test("s'efface dès que le message de la réponse, encore vide, porte sa propre signature", () => {
    // Given — le SDK ajoute la réponse vide sans quitter le statut « submitted »
    const reponseVide: PiloteUIMessage = {
      id: "reponse-1",
      role: "assistant",
      parts: [],
    };

    // When
    const affichee = afficherAttenteReponse({
      status: "submitted",
      messages: [question, reponseVide],
    });

    // Then
    expect(affichee).toBe(false);
  });

  test("ne s'affiche pas hors de l'attente", () => {
    // When
    const affichee = afficherAttenteReponse({
      status: "streaming",
      messages: [question],
    });

    // Then
    expect(affichee).toBe(false);
  });
});
