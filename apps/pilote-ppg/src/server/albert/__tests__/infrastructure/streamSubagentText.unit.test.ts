import { afterEach, describe, expect, test, vi } from "vitest";
import { simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { Albert } from "@/server/albert/Albert";

vi.mock("@/config", () => ({
  configuration: () => ({ albert: { apiKey: "cle-de-test", devTools: false } }),
}));

const modeleQuiEchoue = () =>
  new MockLanguageModelV4({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "stream-start" as const, warnings: [] },
          { type: "text-start" as const, id: "texte-1" },
          { type: "text-delta" as const, id: "texte-1", delta: "# Synthèse" },
          { type: "error" as const, error: new Error("Connect Timeout Error") },
        ],
      }),
    }),
  });

describe("Albert.streamSubagentText", () => {
  afterEach(() => {
    Albert.registerModelWrapper((model) => model);
  });

  test("lève l'erreur de l'API au lieu de finir le texte en silence", async () => {
    // Given
    Albert.registerModelWrapper(() => modeleQuiEchoue());
    const morceaux: string[] = [];

    // When
    const lecture = (async () => {
      for await (const morceau of Albert.streamSubagentText({
        systemPrompt: "Gabarit",
        prompt: "{}",
      })) {
        morceaux.push(morceau);
      }
    })();

    // Then
    await expect(lecture).rejects.toThrow("Connect Timeout Error");
    expect(morceaux).toEqual(["# Synthèse"]);
  });
});
