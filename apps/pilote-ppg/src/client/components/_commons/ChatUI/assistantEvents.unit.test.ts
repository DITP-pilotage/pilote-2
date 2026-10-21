import {
  answerOutcomeEvent,
  choicesPresentedEvent,
  copyExportName,
  exportsAvailableEvents,
  linkEvent,
  lastLlmCallId,
  prefilledPropositionAfterEdit,
  propositionMode,
  propositionsShownEvent,
  questionType,
} from "@/components/_commons/ChatUI/assistantEvents";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

const userMessage: PiloteUIMessage = {
  id: "m-1",
  role: "user",
  parts: [{ type: "text", text: "Bonjour" }],
};

const assistantMessage: PiloteUIMessage = {
  id: "m-2",
  role: "assistant",
  metadata: { llmCallId: "llm-1" },
  parts: [{ type: "text", text: "Bonjour !" }],
};

describe("propositionMode", () => {
  it("distingue l'envoi direct du préremplissage", () => {
    expect(propositionMode("send")).toBe("envoi_direct");
    expect(propositionMode("fill")).toBe("preremplissage");
  });
});

describe("propositionsShownEvent", () => {
  const scenario = {
    id: "synthese_territoire",
    label: "Synthèse",
    message: "Fais une synthèse",
    mode: "send",
  } as const;

  it("compte les propositions d'une liste", () => {
    const event = propositionsShownEvent({
      kind: "flat",
      scenarios: [scenario, { ...scenario, id: "chantiers_en_retard" }],
    });

    expect(event).toEqual({
      action: "view",
      name: "prompt_proposition.view",
      dimensions: { nombre_choix: 2 },
    });
  });

  it("compte les propositions de tous les groupes", () => {
    const event = propositionsShownEvent({
      kind: "grouped",
      groups: [
        { label: "Synthèses", scenarios: [scenario] },
        { label: "Vide", scenarios: [] },
        {
          label: "Comparaisons",
          scenarios: [
            { ...scenario, id: "comparer_territoire" },
            { ...scenario, id: "comparer_jalons" },
          ],
        },
      ],
    });

    expect(event).toEqual({
      action: "view",
      name: "prompt_proposition.view",
      dimensions: { nombre_choix: 3 },
    });
  });
});

describe("prefilledPropositionAfterEdit", () => {
  const proposition = {
    id: "comparer_territoire",
    mode: "preremplissage",
  } as const;

  it("garde la proposition quand son contenu est complété ou modifié", () => {
    expect(
      prefilledPropositionAfterEdit(proposition, "Compare Paris avec Lyon"),
    ).toBe(proposition);
    expect(prefilledPropositionAfterEdit(proposition, "Com")).toBe(proposition);
  });

  it.each(["", "   "])(
    "l'oublie une fois le contenu entièrement effacé (%j)",
    (input) => {
      expect(prefilledPropositionAfterEdit(proposition, input)).toBeUndefined();
    },
  );

  it("ne réattribue pas une saisie libre", () => {
    expect(prefilledPropositionAfterEdit(undefined, "Bonjour")).toBeUndefined();
  });
});

describe("questionType", () => {
  it.each([
    {
      previousMessages: [],
      fromProposition: false,
      attendu: "premiere_libre",
    },
    {
      previousMessages: [],
      fromProposition: true,
      attendu: "premiere_proposition",
    },
    {
      previousMessages: [userMessage, assistantMessage],
      fromProposition: false,
      attendu: "suivante",
    },
    {
      previousMessages: [userMessage, assistantMessage],
      fromProposition: true,
      attendu: "suivante",
    },
  ])(
    "$attendu après $previousMessages.length messages (proposition : $fromProposition)",
    ({ attendu, ...params }) => {
      expect(questionType(params)).toBe(attendu);
    },
  );

  it("reste une première question tant qu'aucune réponse n'est arrivée", () => {
    expect(
      questionType({ previousMessages: [userMessage], fromProposition: false }),
    ).toBe("premiere_libre");
  });
});

describe("lastLlmCallId", () => {
  it("lit l'appel LLM de la dernière réponse", () => {
    expect(lastLlmCallId([userMessage, assistantMessage])).toBe("llm-1");
  });

  it("n'en donne aucun tant que la réponse n'a pas commencé", () => {
    expect(lastLlmCallId([assistantMessage, userMessage])).toBeUndefined();
    expect(lastLlmCallId([])).toBeUndefined();
  });
});

describe("answerOutcomeEvent", () => {
  const params = { conversationId: "conv-1", message: assistantMessage };
  const dimensions = { conversation_id: "conv-1", llm_call_id: "llm-1" };

  it("compte une réponse aboutie", () => {
    expect(
      answerOutcomeEvent({ ...params, isAbort: false, isError: false }),
    ).toEqual({ action: "success", name: "answer.complete", dimensions });
  });

  it("compte une réponse en erreur", () => {
    expect(
      answerOutcomeEvent({ ...params, isAbort: false, isError: true }),
    ).toEqual({ action: "error", name: "answer.error", dimensions });
  });

  it("ne compte rien quand le flux est interrompu", () => {
    expect(
      answerOutcomeEvent({ ...params, isAbort: true, isError: false }),
    ).toBeNull();
  });
});

describe("choicesPresentedEvent", () => {
  const avecChoix: PiloteUIMessage = {
    ...assistantMessage,
    parts: [
      {
        type: "tool-clarify_with_choices",
        toolCallId: "call-1",
        state: "output-available",
        input: { question: "Quel territoire ?", choices: [] },
        output: {
          question: "Quel territoire ?",
          choices: [
            { label: "Paris", value: "paris" },
            { label: "Lyon", value: "lyon" },
            { label: "Lille", value: "lille" },
          ],
          _output_instructions: "",
        },
      },
    ],
  };

  it("compte les options présentées", () => {
    expect(
      choicesPresentedEvent({ conversationId: "conv-1", message: avecChoix }),
    ).toEqual({
      action: "view",
      name: "response.choices",
      dimensions: {
        conversation_id: "conv-1",
        llm_call_id: "llm-1",
        nombre_choix: 3,
      },
    });
  });

  it("ne compte rien sans question à choix", () => {
    expect(
      choicesPresentedEvent({
        conversationId: "conv-1",
        message: assistantMessage,
      }),
    ).toBeNull();
  });
});

describe("linkEvent", () => {
  it.each([
    { href: "/chantier/CH-001/NAT", name: "response.link.internal" },
    { href: "https://www.info.gouv.fr", name: "response.link.external" },
    { href: "//www.info.gouv.fr", name: "response.link.external" },
    { href: undefined, name: "response.link.external" },
  ])("classe $href en $name", ({ href, name }) => {
    expect(linkEvent(href)).toEqual({ action: "select", name });
  });
});

const dashboardPart: PiloteUIMessage["parts"][number] = {
  type: "tool-create_dashboard",
  toolCallId: "call-dashboard",
  state: "output-available",
  input: { task: "Synthèse", territoire_codes: ["NAT-FR"], jalons: [2026] },
  output: { titre: "Synthèse", containers: [], _output_instructions: "" },
};

const rapportPart = (
  format: "markdown" | "pdf",
): PiloteUIMessage["parts"][number] => ({
  type: "tool-export_rapport",
  toolCallId: `call-${format}`,
  state: "output-available",
  input: {
    nom_fichier: "synthese",
    titre: "Synthèse",
    date: "20/10/2026",
    resume: "Résumé",
    format,
    sections: [],
  },
  output: { url: "https://pilote.example.org/rapport", format },
});

describe("copyExportName", () => {
  it("copie le texte d'une réponse sans dashboard", () => {
    expect(copyExportName(assistantMessage)).toBe("export.text");
  });

  it("copie l'image dès qu'un dashboard est affiché", () => {
    expect(
      copyExportName({
        ...assistantMessage,
        parts: [...assistantMessage.parts, dashboardPart],
      }),
    ).toBe("export.dashboard_image");
  });

  it("ne propose rien sans texte ni dashboard", () => {
    expect(
      copyExportName({
        ...assistantMessage,
        parts: [{ type: "text", text: "  " }],
      }),
    ).toBeNull();
  });
});

describe("exportsAvailableEvents", () => {
  it("compte chaque export prêt dans la réponse", () => {
    const events = exportsAvailableEvents({
      conversationId: "conv-1",
      message: {
        ...assistantMessage,
        parts: [
          ...assistantMessage.parts,
          rapportPart("markdown"),
          rapportPart("pdf"),
        ],
      },
    });

    const dimensions = { conversation_id: "conv-1", llm_call_id: "llm-1" };
    expect(events).toEqual([
      { action: "view", name: "export.text", dimensions },
      { action: "view", name: "export.report_markdown", dimensions },
      { action: "view", name: "export.report_pdf", dimensions },
    ]);
  });
});
