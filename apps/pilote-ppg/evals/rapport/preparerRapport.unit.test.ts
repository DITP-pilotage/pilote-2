import { describe, expect, it } from "vitest";
import {
  ajouterAHistorique,
  type EvaliteResults,
  preparerRapport,
} from "./preparerRapport";

const essai = ({
  colOrder,
  question,
  reponse,
  score,
}: {
  colOrder: number;
  question: string;
  reponse: string;
  score: number;
}) => ({
  duration: 1000,
  input: JSON.stringify({ question }),
  output: JSON.stringify({ toolCalls: [], text: reponse }),
  status: "success",
  colOrder,
  renderedColumns: JSON.stringify([
    { label: "Message", value: question },
    // Evalite tronque la réponse dans ses colonnes.
    { label: "Réponse", value: reponse.slice(0, 5) },
  ]),
  averageScore: score,
  scores: [
    {
      name: "Pas d'opinion",
      score,
      description: "Jugé — Identité et périmètre : ne formule ni opinion",
      metadata: JSON.stringify("aucun défaut"),
    },
  ],
});

const resultats = ({
  evals,
}: {
  evals: EvaliteResults["suites"][number]["evals"];
}): EvaliteResults => ({
  run: { id: 16, createdAt: "2026-10-14 09:21:34" },
  suites: [
    {
      name: "3.1 · Synthèse · Synthèse d'un territoire",
      filepath:
        "/Users/quelqu-un/pilote-2/apps/pilote-ppg/evals/3-scenarios/3.1-synthese/syntheseTerritoire.eval.ts",
      status: "success",
      averageScore: 0.5,
      evals,
    },
  ],
});

describe("preparerRapport", () => {
  it("regroupe les essais d'un même cas et sépare les colonnes du cas de celles de l'essai", () => {
    const rapport = preparerRapport({
      commit: "fd0efb4",
      resultats: resultats({
        evals: [
          essai({
            colOrder: 0,
            question: "Synthèse Bretagne",
            reponse: "Réponse complète A",
            score: 1,
          }),
          essai({
            colOrder: 1,
            question: "Synthèse Bretagne",
            reponse: "Réponse complète B",
            score: 0,
          }),
        ],
      }),
    });

    expect(rapport).toEqual({
      run: { id: 16, date: "2026-10-14 09:21:34", commit: "fd0efb4" },
      resume: { score: 0.5, niveaux: { "3": 0.5 } },
      suites: [
        {
          id: "3-1-synthese-synthese-d-un-territoire",
          niveau: "3.1",
          groupe: "Synthèse",
          titre: "Synthèse d'un territoire",
          fichier: "evals/3-scenarios/3.1-synthese/syntheseTerritoire.eval.ts",
          statut: "success",
          score: 0.5,
          cas: [
            {
              titre: "Synthèse Bretagne",
              score: 0.5,
              colonnes: [{ libelle: "Message", valeur: "Synthèse Bretagne" }],
              essais: [
                {
                  statut: "success",
                  duree: 1000,
                  score: 1,
                  colonnes: [
                    { libelle: "Réponse", valeur: "Réponse complète A" },
                  ],
                  scores: [
                    {
                      nom: "Pas d'opinion",
                      score: 1,
                      nature: "juge",
                      regle: "Identité et périmètre : ne formule ni opinion",
                      detail: "aucun défaut",
                    },
                  ],
                },
                {
                  statut: "success",
                  duree: 1000,
                  score: 0,
                  colonnes: [
                    { libelle: "Réponse", valeur: "Réponse complète B" },
                  ],
                  scores: [
                    {
                      nom: "Pas d'opinion",
                      score: 0,
                      nature: "juge",
                      regle: "Identité et périmètre : ne formule ni opinion",
                      detail: "aucun défaut",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("garde le verdict d'une métadonnée structurée et la description entière d'un score hors grille", () => {
    const rapport = preparerRapport({
      commit: null,
      resultats: resultats({
        evals: [
          {
            ...essai({
              colOrder: 0,
              question: "Où en est CH-001 ?",
              reponse: "",
              score: 0,
            }),
            scores: [
              {
                name: "Outils attendus",
                score: 0,
                description:
                  "L'appel doit porter au moins les arguments attendus.",
                metadata: JSON.stringify({
                  verdict: "manquants : search_chantiers",
                  attendus: ["search_chantiers"],
                }),
              },
            ],
          },
        ],
      }),
    });

    expect(rapport.suites[0]?.cas[0]?.essais[0]?.scores).toEqual([
      {
        nom: "Outils attendus",
        score: 0,
        nature: null,
        regle: "L'appel doit porter au moins les arguments attendus.",
        detail: "manquants : search_chantiers",
      },
    ]);
  });
  it("exclut la calibration du juge du score de l'assistant, mais lui donne son propre score", () => {
    const suite = ({
      name,
      averageScore,
    }: {
      name: string;
      averageScore: number;
    }) => ({
      name,
      filepath: "/repo/apps/pilote-ppg/evals/x.eval.ts",
      status: "success",
      averageScore,
      evals: [],
    });

    const rapport = preparerRapport({
      commit: null,
      resultats: {
        run: { id: 1, createdAt: "2026-10-14 09:21:34" },
        suites: [
          suite({
            name: "2.1 · Recherche · search_chantiers",
            averageScore: 1,
          }),
          suite({ name: "3.1 · Synthèse · Synthèse", averageScore: 0.5 }),
          suite({
            name: "3.0 · Calibration du juge · Synthèse",
            averageScore: 0,
          }),
        ],
      },
    });

    expect(rapport.resume).toEqual({
      score: 0.75,
      niveaux: { "2": 1, "3": 0.5, juge: 0 },
    });
  });

  it("ajoute le run à la fin de l'historique", () => {
    const precedent = {
      date: "2026-10-07 09:41:59",
      commit: "4025a78",
      score: 0.8,
      niveaux: { "2": 0.8 },
    };

    const historique = ajouterAHistorique({
      historique: [precedent],
      rapport: {
        run: { id: 16, date: "2026-10-14 09:21:34", commit: "fd0efb4" },
        resume: { score: 0.85, niveaux: { "2": 0.84 } },
        suites: [],
      },
    });

    expect(historique).toEqual([
      precedent,
      {
        date: "2026-10-14 09:21:34",
        commit: "fd0efb4",
        score: 0.85,
        niveaux: { "2": 0.84 },
      },
    ]);
  });
});
