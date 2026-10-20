import {
  answerOutcomeEvent,
  lastLlmCallId,
  prefilledPropositionAfterEdit,
  propositionMode,
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
