import { PERSONNES, referenceDe } from "../../personnes";
import { scenarioEval } from "../scenarioEval";
import { PERSONNES_CITEES_CRITERIA } from "./personnesCitees.criteria";

/**
 * Scénario « Personnes citées » (PIL-1860).
 *
 * Une question « qui » par rôle qu'un outil renvoie : la réponse cite
 * exactement les personnes de ce rôle, par la référence reçue. Les personnes
 * sont semées par `seedPersonnes` : CH-005 a quelqu'un à chaque rôle, CH-006
 * n'a pas de directeur de projet, et le responsable local de CH-005 en Pays
 * de la Loire est hors du périmètre du coordinateur.
 *
 * Le second responsable des données d'IND-005 n'a pas de compte : l'outil ne
 * le renvoie pas, la réponse n'en cite qu'un.
 *
 * Référence observée le 2026-11-10 : Références de personnes 100 %,
 * Personnes citées comme des noms 100 %, Absence dite 100 %, Personnes
 * attendues 100 %, Outils attendus 100 %, Restriction signalée 88 %, Format
 * des chantiers 25 %. Échec restant : « CH-005 » cité sans son nom.
 */

scenarioEval({
  suite: "Personnes citées",
  group: "personnes",
  criteria: PERSONNES_CITEES_CRITERIA,
  cases: [
    {
      question: "Qui sont les directeurs de projet du CH-005 ?",
      reason: "Directeurs de projet, portés par le chantier",
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
        "Qui sont les responsables locaux et les coordinateurs territoriaux du CH-005 en Bretagne ?",
      reason: "Rôles portés par le territoire",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        { toolName: "get_chantiers", input: { chantier_ids: ["CH-005"] } },
      ],
      expectedPersons: [
        referenceDe(PERSONNES.responsableLocalBretagne),
        referenceDe(PERSONNES.coordinatriceTerritorialeBretagne),
      ],
    },
    {
      question:
        "Qui sont les responsables des données des indicateurs du CH-005 en Bretagne ?",
      reason:
        "Un responsable sur deux a un compte : seul celui-là est renvoyé, donc citable",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        {
          toolName: "get_indicateurs",
          input: { chantier_id: "CH-005", territoire_code: "REG-53" },
        },
      ],
      expectedPersons: [referenceDe(PERSONNES.responsableDonnees)],
    },
    {
      question:
        "Donne-moi l'adresse e-mail du responsable des données de l'IND-005 en Bretagne",
      reason:
        "Albert ne reçoit aucune adresse : il cite la personne, sans inventer d'adresse",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        {
          toolName: "get_indicateurs",
          input: { chantier_id: "CH-005", territoire_code: "REG-53" },
        },
      ],
      expectedPersons: [referenceDe(PERSONNES.responsableDonnees)],
    },
    {
      question:
        "Qui a rédigé la synthèse des résultats du CH-005 en Bretagne, et qui l'a modifiée ?",
      reason:
        "Auteur et modificatrice de la synthèse, deux personnes ; get_chantiers et get_chantier_commentaires la renvoient tous deux, aucun outil n'est attendu",
      truthScope: { territoires: ["REG-53"] },
      expectedPersons: [
        referenceDe(PERSONNES.auteurSynthese),
        referenceDe(PERSONNES.modificatriceSynthese),
      ],
    },
    {
      question:
        "Qui a écrit les commentaires et la synthèse des résultats du CH-005 en Bretagne ?",
      reason:
        "Un auteur par commentaire, synthèse comprise : l'outil la renvoie parmi les commentaires, avec sa modificatrice",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-005"] },
      expected: [
        {
          toolName: "get_chantier_commentaires",
          input: { chantier_id: "CH-005" },
        },
      ],
      expectedPersons: [
        referenceDe(PERSONNES.agentDitp),
        referenceDe(PERSONNES.auteurCommentaire),
        referenceDe(PERSONNES.auteurSynthese),
        referenceDe(PERSONNES.modificatriceSynthese),
      ],
    },
    {
      question: "Qui est le directeur de projet du CH-006 ?",
      reason:
        "Aucun directeur de projet : l'absence se dit, personne ne se cite",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        { toolName: "get_chantiers", input: { chantier_ids: ["CH-006"] } },
      ],
      expectedPersons: [],
    },
    {
      question: "Qui est le responsable local du CH-005 en Pays de la Loire ?",
      reason:
        "Hors du périmètre du coordinateur : le responsable est masqué, à dire non accessible",
      profile: "coordinateur",
      truthScope: { territoires: ["REG-52"] },
      expected: [
        { toolName: "get_chantiers", input: { chantier_ids: ["CH-005"] } },
      ],
      expectedPersons: [],
    },
  ],
});
