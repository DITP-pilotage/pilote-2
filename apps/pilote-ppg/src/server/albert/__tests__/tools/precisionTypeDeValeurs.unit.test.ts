import type { ModelMessage } from "ai";
import { describe, expect, test } from "vitest";
import {
  doitDemanderPrecision,
  nommeUnTypeDeValeurs,
} from "@/server/albert/tools/precisionTypeDeValeurs";

describe("nommeUnTypeDeValeurs", () => {
  test.each([
    "Quelles valeurs d'avancement ne sont pas à jour ?",
    "Quelles valeurs d'avnacement ne sont pas à jour ?",
    "Quels indicateurs n'ont pas de cilbe en 2027 ?",
    "Quelles données sont périmées sur l'IND-894 ?",
    "Quels indicateurs ont un retard de mise a jour ?",
    "Quels indicateurs ont du retard des mises à jour ?",
    "Les VA du CH-018",
    "les vi et vc manquantes",
    "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes sur le CH-018 en REG-53",
  ])("nomme un type : %s", (texte) => {
    expect(nommeUnTypeDeValeurs({ texte })).toEqual(true);
  });

  test.each([
    "Quels indicateurs sont non à jour sur le CH-018 ?",
    "Le CH-018 est-il à jour en Bretagne ?",
    "Qu'est-ce qui va devoir être mis à jour ?",
    "Qu'est-ce que je dois renseigner dans le Nord ?",
    "Les remontées du Nord sont-elles à jour ?",
  ])("ne nomme aucun type : %s", (texte) => {
    expect(nommeUnTypeDeValeurs({ texte })).toEqual(false);
  });
});

const appelOutil: ModelMessage = {
  role: "assistant",
  content: [
    {
      type: "tool-call",
      toolCallId: "appel-1",
      toolName: "get_indicateurs_a_completer",
      input: {},
    },
  ],
};

const resultatOutil = (value: Record<string, unknown>): ModelMessage => ({
  role: "tool",
  content: [
    {
      type: "tool-result",
      toolCallId: "appel-1",
      toolName: "get_indicateurs_a_completer",
      output: { type: "json", value: value as never },
    },
  ],
});

describe("doitDemanderPrecision", () => {
  test("demande quand le message ne nomme aucun type", () => {
    const messages: ModelMessage[] = [
      {
        role: "user",
        content: "Quels indicateurs sont non à jour sur le CH-018 ?",
      },
    ];

    expect(doitDemanderPrecision({ messages })).toEqual(true);
  });

  test("ne demande pas quand le message en parts de texte nomme un type", () => {
    const messages: ModelMessage[] = [
      {
        role: "user",
        content: [{ type: "text", text: "Quelles VA ne sont pas à jour ?" }],
      },
    ];

    expect(doitDemanderPrecision({ messages })).toEqual(false);
  });

  test("ne demande pas quand le tour précédent a clos sur une demande de précision", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "Quels sont les chantiers à mettre à jour ?" },
      appelOutil,
      resultatOutil({ precision_demandee: true }),
      { role: "assistant", content: "Choisissez une option pour continuer." },
      { role: "user", content: "les trois" },
    ];

    expect(doitDemanderPrecision({ messages })).toEqual(false);
  });

  test("ne demande pas quand le tour précédent a renvoyé des données", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "Quelles VA ne sont pas à jour ?" },
      appelOutil,
      resultatOutil({ perimetre: "le CH-018", indicateurs: [] }),
      { role: "assistant", content: "Voici le résumé." },
      { role: "user", content: "Et sur le CH-019 ?" },
    ];

    expect(doitDemanderPrecision({ messages })).toEqual(false);
  });

  test("demande quand le tour précédent s'est arrêté sur un accès refusé", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: "Quelles VA ne sont pas à jour ?" },
      appelOutil,
      resultatOutil({ acces_refuse: true }),
      { role: "assistant", content: "Vous n'avez pas accès." },
      {
        role: "user",
        content: "Qu'est-ce qui est à mettre à jour sur le CH-018 ?",
      },
    ];

    expect(doitDemanderPrecision({ messages })).toEqual(true);
  });

  test("demande quand la précision a été demandée dans le même tour", () => {
    const messages: ModelMessage[] = [
      {
        role: "user",
        content: "Quels indicateurs sont non à jour sur le CH-018 ?",
      },
      appelOutil,
      resultatOutil({ precision_demandee: true }),
    ];

    expect(doitDemanderPrecision({ messages })).toEqual(true);
  });
});
