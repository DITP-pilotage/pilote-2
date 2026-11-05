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
      metadata: {
        verdict: "outils interdits appelés : search_chantiers",
        attendus: ["get_chantiers"],
        interdits: ["search_chantiers"],
      },
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

  it("matche un argument objet en sous-ensemble, à toute profondeur", () => {
    const result = scoreExpectedTools({
      output: turn([
        {
          toolName: "get_taux_avancement_territoire",
          input: {
            perimetre: {
              type: "SELECTION",
              territoire_codes: ["DEPT-33", "DEPT-59"],
            },
            jalon: 2026,
          },
        },
      ]),
      expected: [
        {
          toolName: "get_taux_avancement_territoire",
          input: {
            perimetre: { type: "SELECTION", territoire_codes: ["DEPT-59"] },
          },
        },
      ],
    });

    expect(result.score).toBe(1);
  });

  it("note 0 quand le type de périmètre attendu diffère", () => {
    const result = scoreExpectedTools({
      output: turn([
        {
          toolName: "get_taux_avancement_territoire",
          input: {
            perimetre: { type: "SELECTION", territoire_codes: ["REG-53"] },
          },
        },
      ]),
      expected: [
        {
          toolName: "get_taux_avancement_territoire",
          input: {
            perimetre: {
              type: "REGION_ET_SES_DEPARTEMENTS",
              region_code: "REG-53",
            },
          },
        },
      ],
    });

    expect(result.score).toBe(0);
  });

  it("compare motifs comme un ensemble exact, quel que soit l'ordre", () => {
    const expected = [
      { toolName: "get_indicateurs_a_completer", input: { motifs: ["va"] } },
    ];
    const appel = (motifs: string[]) =>
      scoreExpectedTools({
        output: turn([
          { toolName: "get_indicateurs_a_completer", input: { motifs } },
        ]),
        expected,
      }).score;

    expect({
      identique: appel(["va"]),
      enTrop: appel(["va", "vi", "vc"]),
      ordreInverse: scoreExpectedTools({
        output: turn([
          {
            toolName: "get_indicateurs_a_completer",
            input: { motifs: ["vc", "vi"] },
          },
        ]),
        expected: [
          {
            toolName: "get_indicateurs_a_completer",
            input: { motifs: ["vi", "vc"] },
          },
        ],
      }).score,
    }).toEqual({ identique: 1, enTrop: 0, ordreInverse: 1 });
  });

  it("décrit les appels attendus avec leurs arguments", () => {
    const result = scoreExpectedTools({
      output: turn([
        { toolName: "get_chantiers", input: { view: "en_retard" } },
      ]),
      expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
    });

    expect(result.metadata).toEqual({
      verdict: "tous les appels attendus sont présents",
      attendus: ['get_chantiers({"view":"en_retard"})'],
      interdits: [],
    });
  });

  it("ne vérifie que les outils interdits quand le cas n'a pas d'attente", () => {
    const result = scoreExpectedTools({
      output: turn([{ toolName: "get_indicateurs" }]),
      expected: undefined,
      forbidden: ["search_chantiers"],
    });

    expect(result).toEqual({
      score: 1,
      metadata: {
        verdict: "aucun outil interdit appelé",
        attendus: "aucune attente",
        interdits: ["search_chantiers"],
      },
    });
  });

  it("note 0 quand une option proposée correspond à une option interdite", () => {
    const result = scoreExpectedTools({
      output: turn([
        {
          toolName: "clarify_with_choices",
          input: {
            question: "Quelle visualisation ?",
            choices: [
              {
                label: "Le tableau des chantiers de la Sarthe",
                value: "tableau",
              },
              {
                label: "Une carte de la Sarthe avec les chantiers",
                value: "carte",
              },
            ],
          },
        },
      ]),
      expected: [{ toolName: "clarify_with_choices" }],
      optionsInterdites: [
        {
          motif: "carte.*\\bchantiers\\b",
          raison: "aucune carte ne montre tous les chantiers",
        },
      ],
    });

    expect(result.score).toBe(0);
    expect(result.metadata.verdict).toBe(
      "options interdites proposées : « Une carte de la Sarthe avec les chantiers » (aucune carte ne montre tous les chantiers)",
    );
  });

  it("ignore la casse d'une option interdite", () => {
    const result = scoreExpectedTools({
      output: turn([
        {
          toolName: "clarify_with_choices",
          input: {
            question: "Quelle visualisation ?",
            choices: [
              { label: "CARTE", value: "carte" },
              { label: "Tableau", value: "tableau" },
            ],
          },
        },
      ]),
      expected: [{ toolName: "clarify_with_choices" }],
      optionsInterdites: [{ motif: "carte", raison: "pas de carte" }],
    });

    expect(result.score).toBe(0);
  });

  it("note normalement quand aucune option proposée n'est interdite", () => {
    const result = scoreExpectedTools({
      output: turn([
        {
          toolName: "clarify_with_choices",
          input: {
            question: "Quelle visualisation ?",
            choices: [
              {
                label: "La carte du taux d'avancement d'un chantier précis",
                value: "carte",
              },
              {
                label: "Le tableau des chantiers de la Sarthe",
                value: "tableau",
              },
            ],
          },
        },
      ]),
      expected: [{ toolName: "clarify_with_choices" }],
      optionsInterdites: [
        {
          motif: "carte.*\\bchantiers\\b",
          raison: "aucune carte ne montre tous les chantiers",
        },
      ],
    });

    expect(result.score).toBe(1);
  });
});
