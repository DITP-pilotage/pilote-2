import {
  answerOutcomeEvent,
  lastLlmCallId,
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

describe("questionType", () => {
  it.each([
    {
      previousMessageCount: 0,
      fromProposition: false,
      attendu: "premiere_libre",
    },
    {
      previousMessageCount: 0,
      fromProposition: true,
      attendu: "premiere_proposition",
    },
    { previousMessageCount: 2, fromProposition: false, attendu: "suivante" },
    { previousMessageCount: 2, fromProposition: true, attendu: "suivante" },
  ])(
    "$attendu après $previousMessageCount messages (proposition : $fromProposition)",
    ({ attendu, ...params }) => {
      expect(questionType(params)).toBe(attendu);
    },
  );
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
