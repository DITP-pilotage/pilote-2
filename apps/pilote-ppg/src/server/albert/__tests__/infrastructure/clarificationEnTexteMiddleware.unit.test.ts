import { describe, expect, test } from "vitest";
import {
  generateText,
  simulateReadableStream,
  streamText,
  tool,
  wrapLanguageModel,
  type ToolSet,
} from "ai";
import { MockLanguageModelV4 } from "ai/test";
import type { LanguageModelV4StreamPart } from "@ai-sdk/provider";
import { z } from "zod";
import { clarificationEnTexteMiddleware } from "@/server/albert/infrastructure/clarificationEnTexteMiddleware";
import { clarifyWithChoicesTool } from "@/server/albert/tools/clarifyWithChoices";

const CLARIFICATION = {
  question: "Quel chantier souhaitez-vous cartographier ?",
  choices: [
    {
      label: "La carte du taux d'avancement du CH-001 par région",
      value: "CH-001",
    },
    {
      label: "La carte du taux d'avancement du CH-002 par région",
      value: "CH-002",
    },
  ],
};

const USAGE = {
  inputTokens: {
    total: 10,
    noCache: 10,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 5, text: 5, reasoning: undefined },
};

const getChantiersTool = tool({
  description: "Les chantiers",
  inputSchema: z.object({}),
  execute: async () => ({ chantiers: [] }),
});

const OUTILS_AGENT: ToolSet = {
  clarify_with_choices: clarifyWithChoicesTool,
  get_chantiers: getChantiersTool,
};

const modeleQuiDiffuse = ({
  morceaux,
  outilsAppeles = [],
}: {
  morceaux: string[];
  outilsAppeles?: LanguageModelV4StreamPart[];
}) =>
  wrapLanguageModel({
    model: new MockLanguageModelV4({
      doStream: async () => ({
        stream: simulateReadableStream<LanguageModelV4StreamPart>({
          chunks: [
            { type: "stream-start", warnings: [] },
            { type: "text-start", id: "texte-1" },
            ...morceaux.map((delta): LanguageModelV4StreamPart => ({
              type: "text-delta",
              id: "texte-1",
              delta,
            })),
            { type: "text-end", id: "texte-1" },
            ...outilsAppeles,
            {
              type: "finish",
              finishReason: {
                unified: outilsAppeles.length > 0 ? "tool-calls" : "stop",
                raw: undefined,
              },
              usage: USAGE,
            },
          ],
        }),
      }),
    }),
    middleware: clarificationEnTexteMiddleware,
  });

const diffuser = async ({
  morceaux,
  outilsAppeles,
  tools = OUTILS_AGENT,
}: {
  morceaux: string[];
  outilsAppeles?: LanguageModelV4StreamPart[];
  tools?: ToolSet;
}) => {
  const result = streamText({
    model: modeleQuiDiffuse({ morceaux, outilsAppeles }),
    prompt: "Je veux la cartographie du taux d'avancement par région",
    tools,
  });
  await result.consumeStream();

  return {
    text: await result.text,
    toolCalls: (await result.toolCalls).map(({ toolName, input }) => ({
      toolName,
      input,
    })),
    toolResults: (await result.toolResults).map(({ toolName, output }) => ({
      toolName,
      output,
    })),
  };
};

// Le JSON arrive en plusieurs morceaux, comme dans un vrai flux.
const JSON_EN_MORCEAUX = [
  JSON.stringify(CLARIFICATION).slice(0, 20),
  JSON.stringify(CLARIFICATION).slice(20),
];

describe("clarificationEnTexteMiddleware", () => {
  test("transforme une clarification écrite en JSON en appel de clarify_with_choices", async () => {
    // When
    const result = await diffuser({ morceaux: JSON_EN_MORCEAUX });

    // Then
    expect(result).toEqual({
      text: "",
      toolCalls: [{ toolName: "clarify_with_choices", input: CLARIFICATION }],
      toolResults: [
        { toolName: "clarify_with_choices", output: CLARIFICATION },
      ],
    });
  });

  test("rattrape aussi une clarification dans un bloc de code json", async () => {
    // When
    const result = await diffuser({
      morceaux: ["```json\n", JSON.stringify(CLARIFICATION), "\n```"],
    });

    // Then
    expect(result.toolCalls).toEqual([
      { toolName: "clarify_with_choices", input: CLARIFICATION },
    ]);
  });

  test("laisse passer un texte ordinaire", async () => {
    // When
    const result = await diffuser({
      morceaux: ["Le taux d'avancement ", "de la Bretagne est de 46 %."],
    });

    // Then
    expect(result).toEqual({
      text: "Le taux d'avancement de la Bretagne est de 46 %.",
      toolCalls: [],
      toolResults: [],
    });
  });

  test("rend tel quel un JSON qui n'est pas une clarification", async () => {
    // When
    const result = await diffuser({ morceaux: ['{"chantiers": []}'] });

    // Then
    expect(result).toEqual({
      text: '{"chantiers": []}',
      toolCalls: [],
      toolResults: [],
    });
  });

  test("ne touche pas au texte d'un modèle qui n'expose pas clarify_with_choices", async () => {
    // When
    const result = await diffuser({
      morceaux: [JSON.stringify(CLARIFICATION)],
      tools: { get_chantiers: getChantiersTool },
    });

    // Then
    expect(result).toEqual({
      text: JSON.stringify(CLARIFICATION),
      toolCalls: [],
      toolResults: [],
    });
  });

  test("ne rattrape rien quand le modèle a appelé un outil", async () => {
    // When
    const result = await diffuser({
      morceaux: [JSON.stringify(CLARIFICATION)],
      outilsAppeles: [
        {
          type: "tool-call",
          toolCallId: "appel-1",
          toolName: "get_chantiers",
          input: "{}",
        },
      ],
    });

    // Then
    expect(result).toEqual({
      text: JSON.stringify(CLARIFICATION),
      toolCalls: [{ toolName: "get_chantiers", input: {} }],
      toolResults: [{ toolName: "get_chantiers", output: { chantiers: [] } }],
    });
  });

  test("transforme aussi la clarification d'une génération sans flux", async () => {
    // Given
    const model = wrapLanguageModel({
      model: new MockLanguageModelV4({
        doGenerate: async () => ({
          content: [{ type: "text", text: JSON.stringify(CLARIFICATION) }],
          finishReason: { unified: "stop", raw: undefined },
          usage: USAGE,
          warnings: [],
        }),
      }),
      middleware: clarificationEnTexteMiddleware,
    });

    // When
    const result = await generateText({
      model,
      prompt: "Je veux la cartographie du taux d'avancement par région",
      tools: OUTILS_AGENT,
    });

    // Then
    expect(
      result.toolCalls.map(({ toolName, input }) => ({ toolName, input })),
    ).toEqual([{ toolName: "clarify_with_choices", input: CLARIFICATION }]);
    expect(result.text).toBe("");
  });
});
