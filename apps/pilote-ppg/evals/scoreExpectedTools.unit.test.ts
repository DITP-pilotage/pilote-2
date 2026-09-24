import { describe, expect, it } from "vitest";
import { scoreExpectedTools } from "./scoreExpectedTools";
import type { AgentTurn } from "./types";

const turn = (toolCalls: AgentTurn["toolCalls"]): AgentTurn => ({
  toolCalls,
  text: "",
  stepCount: toolCalls.length,
});

describe("scoreExpectedTools", () => {
  it("note 1 quand aucun outil n'est attendu et qu'aucun n'est appelé", () => {
    const result = scoreExpectedTools({ output: turn([]), expected: [] });

    expect(result.score).toBe(1);
  });

  it("note 0 quand aucun outil n'est attendu mais qu'un outil est appelé", () => {
    const result = scoreExpectedTools({
      output: turn([{ toolName: "get_chantiers" }]),
      expected: [],
    });

    expect(result.score).toBe(0);
  });

  it("matche les arguments en sous-ensemble : les arguments en trop sont libres", () => {
    const result = scoreExpectedTools({
      output: turn([
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

    expect(result.score).toBe(1);
  });

  it("note 0 quand un argument attendu diffère", () => {
    const result = scoreExpectedTools({
      output: turn([
        { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      ]),
      expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
    });

    expect(result.score).toBe(0);
  });

  it("note la proportion d'appels attendus retrouvés", () => {
    const result = scoreExpectedTools({
      output: turn([
        { toolName: "get_chantiers", input: { view: "en_retard" } },
      ]),
      expected: [
        { toolName: "get_chantiers", input: { view: "en_retard" } },
        { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      ],
    });

    expect(result.score).toBe(0.5);
  });

  it("note 0 quand un outil interdit est appelé, même si les attendus sont présents", () => {
    const result = scoreExpectedTools({
      output: turn([
        { toolName: "search_chantiers" },
        { toolName: "get_chantiers" },
      ]),
      expected: [{ toolName: "get_chantiers" }],
      forbidden: ["search_chantiers"],
    });

    expect(result).toEqual({
      score: 0,
      metadata: "outils interdits appelés : search_chantiers",
    });
  });

  it("note les attendus quand aucun outil interdit n'est appelé", () => {
    const result = scoreExpectedTools({
      output: turn([{ toolName: "get_chantiers" }]),
      expected: [{ toolName: "get_chantiers" }],
      forbidden: ["search_chantiers"],
    });

    expect(result.score).toBe(1);
  });

  it("compare les arguments tableaux par valeur", () => {
    const result = scoreExpectedTools({
      output: turn([
        {
          toolName: "search_indicateurs",
          input: { query: "lecture", chantier_ids: ["CH-018"] },
        },
      ]),
      expected: [
        {
          toolName: "search_indicateurs",
          input: { chantier_ids: ["CH-018"] },
        },
      ],
    });

    expect(result.score).toBe(1);
  });

  it("accepte un argument tableau qui contient au moins les valeurs attendues", () => {
    const result = scoreExpectedTools({
      output: turn([
        {
          toolName: "get_chantier_commentaires",
          input: { types: ["freins_a_lever", "actions_a_venir"] },
        },
      ]),
      expected: [
        {
          toolName: "get_chantier_commentaires",
          input: { types: ["freins_a_lever"] },
        },
      ],
    });

    expect(result.score).toBe(1);
  });

  it("note 0 quand une valeur attendue manque dans un argument tableau", () => {
    const result = scoreExpectedTools({
      output: turn([
        {
          toolName: "get_chantier_commentaires",
          input: { types: ["actions_a_venir"] },
        },
      ]),
      expected: [
        {
          toolName: "get_chantier_commentaires",
          input: { types: ["freins_a_lever"] },
        },
      ],
    });

    expect(result.score).toBe(0);
  });
});
