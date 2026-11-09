import type { ToolCase } from "../../types";
import { toolSelectionEval } from "../toolSelectionEval";
import { DEMANDES_PRECISES } from "./demandesPrecises";

/**
 * Niveau 2 — `rediger_synthese_chantier` (PIL-1966).
 *
 * La synthèse d'un chantier sur un territoire ne doit pas ouvrir la synthèse
 * du territoire : Albert rédigeait d'abord celle du Morbihan, puis celle du
 * chantier demandé. Les messages reprennent le scénario « Synthèse d'un
 * chantier sur un territoire » de l'accueil, CH-XXX complété.
 *
 * Référence avant l'outil (2026-11-09) : « ce chantier » sur la page chantier
 * appelait `rediger_synthese_territoire` dans 1 essai sur 3, puis
 * `get_chantiers` ; les autres cas passaient par les outils de données.
 */

const SYNTHESE_CH005 = (territoire_code: string) => [
  {
    toolName: "rediger_synthese_chantier",
    input: { chantier_id: "CH-005", territoire_code },
  },
];

const MESSAGE_SCENARIO = (territoire: string) =>
  `Fais moi la synthèse du chantier CH-005 sur ${territoire}
Quel est son écart à la médiane ?
Quelles sont les principales difficultés remontées dans les commentaires ?`;

const ACCUEIL_MORBIHAN = { territoireCode: "DEPT-56", jalon: 2025 };
const ACCUEIL_BRETAGNE = { territoireCode: "REG-53", jalon: 2025 };

const CASES: ToolCase[] = [
  {
    question: MESSAGE_SCENARIO("56 - Morbihan"),
    reason: "le message du ticket : scénario coordinateur sur le Morbihan",
    profil: "coordinateur",
    contexteAccueil: ACCUEIL_MORBIHAN,
    expected: SYNTHESE_CH005("DEPT-56"),
    forbidden: ["rediger_synthese_territoire"],
  },
  {
    question: "Fais moi la synthèse du chantier CH-005 sur 56 - Morbihan",
    reason: "la première ligne du scénario, seule",
    profil: "coordinateur",
    contexteAccueil: ACCUEIL_MORBIHAN,
    expected: SYNTHESE_CH005("DEPT-56"),
    forbidden: ["rediger_synthese_territoire"],
  },
  {
    question: MESSAGE_SCENARIO("Bretagne"),
    reason: "scénario coordinateur sur sa région",
    profil: "coordinateur",
    contexteAccueil: ACCUEIL_BRETAGNE,
    expected: SYNTHESE_CH005("REG-53"),
    forbidden: ["rediger_synthese_territoire"],
  },
  {
    question: MESSAGE_SCENARIO("le territoire Bretagne"),
    reason: "scénario DITP, NOM_TERRITOIRE complété",
    contexteAccueil: ACCUEIL_BRETAGNE,
    expected: SYNTHESE_CH005("REG-53"),
    forbidden: ["rediger_synthese_territoire"],
  },
  {
    question: "Fais-moi la synthèse du CH-005 en Bretagne",
    reason: "un chantier par son seul identifiant",
    expected: SYNTHESE_CH005("REG-53"),
    forbidden: ["rediger_synthese_territoire"],
  },
  {
    question: "Fais moi la synthèse de ce chantier",
    reason: "« ce chantier » sur la page chantier : le chantier courant",
    profil: "coordinateur",
    contexteChantier: {
      chantierId: "CH-005",
      chantierNom: "Réduire les délais de passage aux urgences",
      territoireCode: "DEPT-56",
      jalon: 2025,
    },
    expected: SYNTHESE_CH005("DEPT-56"),
    forbidden: ["rediger_synthese_territoire"],
  },
  {
    question: "Fais-moi la synthèse de la Bretagne",
    reason: "la synthèse d'un territoire, sans chantier désigné",
    expected: [{ toolName: "rediger_synthese_territoire" }],
    forbidden: ["rediger_synthese_chantier"],
  },
  {
    question: "Quels sont les commentaires du CH-005 en Bretagne ?",
    reason: "une donnée précise du chantier : get_chantier_commentaires",
    forbidden: ["rediger_synthese_chantier", "rediger_synthese_territoire"],
  },
  ...DEMANDES_PRECISES,
];

toolSelectionEval({
  famille: "rendu",
  tool: "rediger_synthese_chantier",
  cases: CASES,
});
