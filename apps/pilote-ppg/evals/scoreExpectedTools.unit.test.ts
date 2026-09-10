import { describe, expect, it } from "vitest";
import { scoreExpectedTools } from "./scoreExpectedTools";
import type { AgentTurn } from "./types";

const tour = (toolCalls: AgentTurn["toolCalls"]): AgentTurn => ({
  toolCalls,
  text: "",
  stepCount: toolCalls.length,
});

describe("scoreExpectedTools", () => {
  it("note 1 quand aucun outil n'est attendu et qu'aucun n'est appelé", () => {
    const resultat = scoreExpectedTools({ output: tour([]), expected: [] });

    expect(resultat.score).toBe(1);
  });

  it("note 0 quand aucun outil n'est attendu mais qu'un outil est appelé", () => {
    const resultat = scoreExpectedTools({
      output: tour([{ toolName: "get_chantiers" }]),
      expected: [],
    });

    expect(resultat.score).toBe(0);
  });

  it("matche les arguments en sous-ensemble : les arguments en trop sont libres", () => {
    const resultat = scoreExpectedTools({
      output: tour([
        {
          toolName: "get_chantiers",
          input: {
            view: "en_retard",
            territoire_code: "REG-53",
            jalon: 2025,
          },
        },
      ]),
      expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
    });

    expect(resultat.score).toBe(1);
  });

  it("note 0 quand un argument attendu diffère", () => {
    const resultat = scoreExpectedTools({
      output: tour([
        { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      ]),
      expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
    });

    expect(resultat.score).toBe(0);
  });

  it("note la proportion d'appels attendus retrouvés", () => {
    const resultat = scoreExpectedTools({
      output: tour([
        { toolName: "get_chantiers", input: { view: "en_retard" } },
      ]),
      expected: [
        { toolName: "get_chantiers", input: { view: "en_retard" } },
        { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      ],
    });

    expect(resultat.score).toBe(0.5);
  });
});
