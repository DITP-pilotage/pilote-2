import type { Perimetre } from "@/server/albert/domain/Perimetre";
import { scenarioEval } from "../scenarioEval";
import { QUESTIONS_DE_SUIVI_CRITERIA } from "./questionsDeSuivi.criteria";

/**
 * Scénario « Questions de suivi » (PIL-1949). Au second tour, l'agent a déjà
 * des résultats d'outils sous les yeux : il doit rappeler un outil quand la
 * question en demande plus (une autre maille, un autre jalon, un autre type
 * de donnée), sans annoncer d'absence sur la foi d'un autre périmètre. Quand
 * la question porte sur ce qu'il sait déjà, il ne redemande rien à
 * l'utilisateur ; rappeler un outil reste permis (un tri, par exemple).
 *
 * CH-005 est en retard en Bretagne (écart −15), avec un indicateur et deux
 * commentaires typés. La synthèse de territoire ne porte que le commentaire
 * de synthèse : ni les indicateurs, ni les autres commentaires.
 */

const BRETAGNE: Perimetre = { type: "SELECTION", territoire_codes: ["REG-53"] };
const BRETAGNE_ET_SES_DEPARTEMENTS: Perimetre = {
  type: "REGION_ET_SES_DEPARTEMENTS",
  region_code: "REG-53",
};

scenarioEval({
  suite: "Questions de suivi",
  group: "suivi",
  criteria: QUESTIONS_DE_SUIVI_CRITERIA,
  cases: [
    {
      history: ["Quel est le taux d'avancement de la Bretagne ?"],
      question: "Détaille par département",
      reason: "autre maille : les départements de la région",
      truthScope: {
        territoires: ["REG-53"],
        perimetre: BRETAGNE_ET_SES_DEPARTEMENTS,
      },
      expected: [
        {
          toolName: "get_taux_avancement_territoire",
          input: { perimetre: BRETAGNE_ET_SES_DEPARTEMENTS },
        },
      ],
      forbidden: ["clarify_with_choices"],
    },
    {
      history: ["Quels sont les chantiers en retard en Bretagne ?"],
      question: "Détaille par département",
      reason: "autre maille, sur la même vue",
      truthScope: {
        territoires: ["REG-53"],
        perimetre: BRETAGNE_ET_SES_DEPARTEMENTS,
      },
      expected: [
        {
          toolName: "get_chantiers",
          input: { view: "en_retard", perimetre: BRETAGNE_ET_SES_DEPARTEMENTS },
        },
      ],
      forbidden: ["clarify_with_choices"],
    },
    {
      history: ["Fais moi la synthèse de la Bretagne"],
      question: "Détaille par département",
      reason:
        "après un encart régional : il ne couvre pas les départements (outil libre, voir « Départements interrogés »)",
      truthScope: {
        territoires: ["REG-53"],
        perimetre: BRETAGNE_ET_SES_DEPARTEMENTS,
      },
      forbidden: ["clarify_with_choices"],
    },
    {
      history: ["Quels sont les chantiers en retard en Bretagne ?"],
      question: "Et leurs indicateurs non à jour ?",
      reason:
        "ambigu : ni la valeur d'avancement ni la cible ne sont nommées, le périmètre est connu ; get_indicateurs_a_completer demande lui-même la précision",
      truthScope: { territoires: ["REG-53"] },
      expected: [{ toolName: "get_indicateurs_a_completer" }],
      forbidden: ["clarify_with_choices"],
    },
    {
      history: ["Quels chantiers ont des indicateurs non à jour en Bretagne ?"],
      question: "Valeurs d'avancement non à jour en REG-53",
      reason:
        "clic sur un choix de la précision : rappeler l'outil avec le motif choisi, la consigne du tour précédent ne vaut plus",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        { toolName: "get_indicateurs_a_completer", input: { motifs: ["va"] } },
      ],
      forbidden: ["clarify_with_choices"],
    },
    {
      history: ["Quel est le taux d'avancement de la Bretagne ?"],
      question: "Et en 2024 ?",
      reason: "autre jalon, même territoire",
      truthScope: { territoires: ["REG-53"], jalons: [2024] },
      expected: [
        {
          toolName: "get_taux_avancement_territoire",
          input: { perimetre: BRETAGNE, jalon: 2024 },
        },
      ],
    },
    {
      history: ["Quels sont les chantiers en retard en Bretagne ?"],
      question: "Quels sont leurs commentaires ?",
      reason: "autre type de donnée : la liste ne porte que la synthèse",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-005"] },
      expected: [
        {
          toolName: "get_chantier_commentaires",
          input: { chantier_id: "CH-005" },
        },
      ],
    },
    {
      history: ["Fais moi la synthèse de la Bretagne"],
      question: "Quelles sont les valeurs des indicateurs du CH-005 ?",
      reason: "après un encart : il ne contient aucun indicateur",
      truthScope: { territoires: ["REG-53"], indicateurs: true },
      expected: [
        {
          toolName: "get_indicateurs",
          input: { chantier_id: "CH-005", territoire_code: "REG-53" },
        },
      ],
    },
    {
      history: ["Fais moi la synthèse de la Bretagne"],
      question: "Y a-t-il des commentaires sur les données du CH-005 ?",
      reason:
        "après un encart : son commentaire de synthèse n'est pas un commentaire sur les données",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-005"] },
      expected: [
        {
          toolName: "get_chantier_commentaires",
          input: { chantier_id: "CH-005" },
        },
      ],
    },
    {
      history: [
        "Quels sont les chantiers en retard ou en difficulté en Bretagne ?",
      ],
      question: "Classe-les par écart à la médiane",
      reason:
        "déjà connu : ne redemande rien (rappeler get_chantiers avec un tri reste permis)",
      truthScope: { territoires: ["REG-53"] },
      forbidden: ["clarify_with_choices"],
    },
    {
      history: ["Fais moi la synthèse de la Bretagne"],
      question: "Quel est l'écart à la médiane du CH-005 ?",
      reason:
        "déjà connu : l'encart donne l'écart de CH-005, ne redemande rien",
      truthScope: { territoires: ["REG-53"] },
      forbidden: ["clarify_with_choices"],
    },
  ],
});
