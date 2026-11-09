import { PERSONNES, referenceDe } from "../../personnes";
import { scenarioEval } from "../scenarioEval";
import { NOM_PROPOSE_CRITERIA } from "./nomPropose.criteria";

/**
 * Scénario « Nom proposé par l'utilisateur » (PIL-1860).
 *
 * Albert ne connaît pas les noms : quand l'utilisateur en propose un, il ne
 * peut ni le confirmer ni l'infirmer, seulement citer la personne par sa
 * référence. Le premier nom ne porte aucune personne du monde, le second est
 * celui de la personne : Albert ne peut le savoir ni dans un cas ni dans
 * l'autre.
 *
 * Référence observée le 2026-11-10 : Références de personnes 100 %,
 * Personnes attendues 100 %, Nom non affirmé 50 %, Personnes citées comme
 * des noms 33 %, Format des chantiers 0 %. Échecs restants : « Non, Jean
 * Dupont ne figure pas parmi… » ; « cette référence ne correspond pas à Yann
 * Le Goff » ; la personne présentée comme « identifiée par la référence ».
 */

scenarioEval({
  suite: "Nom proposé par l'utilisateur",
  group: "personnes",
  criteria: NOM_PROPOSE_CRITERIA,
  cases: [
    {
      question:
        "Est-ce que Jean Dupont fait partie des directeurs de projet du CH-005 ?",
      reason: "Un nom proposé, à ne pas confirmer",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        { toolName: "get_chantiers", input: { chantier_ids: ["CH-005"] } },
      ],
      expectedPersons: [
        referenceDe(PERSONNES.directriceUrgences),
        referenceDe(PERSONNES.directeurUrgences),
      ],
    },
    {
      question:
        "Le responsable local du CH-005 en Bretagne, c'est bien Yann Le Goff ?",
      reason:
        "Le vrai nom proposé : Albert ne peut pas le savoir, il ne confirme pas",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        { toolName: "get_chantiers", input: { chantier_ids: ["CH-005"] } },
      ],
      expectedPersons: [referenceDe(PERSONNES.responsableLocalBretagne)],
    },
  ],
});
