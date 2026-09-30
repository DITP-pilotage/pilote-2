import type { Evidence } from "./evidence";
import {
  checkNoMeteoCode,
  checkNoToolName,
  checkOfficialCodes,
  type CheckResult,
} from "./mechanicalChecks";

export type MatterKind = "text" | "dashboard" | "rapport";

export type MechanicalCriterion = {
  kind: "mechanical";
  id: string;
  /** La règle du prompt système vérifiée, citée dans le rapport. */
  rule: string;
  check: (evidence: Evidence) => CheckResult;
  applicable?: (evidence: Evidence) => boolean;
};

export type JudgedCriterion = {
  kind: "judged";
  id: string;
  rule: string;
  /** Ce que le juge doit constater. */
  instruction: string;
  applicable?: (evidence: Evidence) => boolean;
};

export type Criterion = MechanicalCriterion | JudgedCriterion;

export type Grid = {
  family: string;
  matter: MatterKind;
  criteria: Criterion[];
};

export function mechanical(
  criterion: Omit<MechanicalCriterion, "kind">,
): MechanicalCriterion {
  return { kind: "mechanical", ...criterion };
}

export function judged(
  criterion: Omit<JudgedCriterion, "kind">,
): JudgedCriterion {
  return { kind: "judged", ...criterion };
}

export const BASE_IDS = {
  noToolName: "Pas de nom d'outil",
  noMeteoCode: "Libellés météo",
  officialCodes: "Codes officiels",
  noOpinion: "Pas d'opinion",
  exactFigures: "Chiffres exacts",
  restriction: "Restriction signalée",
} as const;

/**
 * Le socle : les « Règles fondamentales » du prompt, valables pour toute
 * réponse. Elles portent sur la matière, qui peut être un rapport ou un
 * dashboard décrit.
 */
const BASE: Criterion[] = [
  mechanical({
    id: BASE_IDS.noToolName,
    rule: "Noms d'outils internes : ne cite jamais le nom technique d'un outil",
    check: (evidence) => checkNoToolName({ text: evidence.matter }),
  }),
  mechanical({
    id: BASE_IDS.noMeteoCode,
    rule: "Météo : jamais les codes SOLEIL, COUVERT, NUAGE, ORAGE, toujours les libellés",
    check: (evidence) => checkNoMeteoCode({ text: evidence.matter }),
  }),
  mechanical({
    id: BASE_IDS.officialCodes,
    rule: "Format des chantiers : codes officiels CH-XXX, REG-XX, DEPT-XX",
    check: (evidence) => checkOfficialCodes({ text: evidence.matter }),
  }),
  judged({
    id: BASE_IDS.noOpinion,
    rule: "Identité et périmètre : ne formule ni opinion, ni recommandation, ni jugement",
    instruction:
      "La réponse décrit les données sans conseiller, recommander, prioriser ni qualifier moralement. « Il conviendrait de », « il est urgent de », « la situation est préoccupante » sont non conformes. Une tendance factuelle (« les écarts se concentrent sur la santé ») est conforme.",
  }),
  judged({
    id: BASE_IDS.exactFigures,
    rule: "Factualité : n'invente jamais de données ni de chiffres absents des résultats des outils",
    instruction:
      "Chaque chiffre de la réponse (taux, médiane, écart, valeur d'indicateur, nombre de chantiers, date) figure dans les DONNÉES REÇUES PAR L'ASSISTANT, ou s'en déduit par un calcul simple et juste (une différence de taux par exemple). Un chiffre introuvable ou faux est non conforme ; cite-le dans la preuve. Un arrondi à l'unité est conforme.",
  }),
  judged({
    id: BASE_IDS.restriction,
    rule: "Territoires accessibles : les champs masqués le sont par restriction d'accès, et non absents",
    instruction:
      "Pour les territoires listés comme MASQUÉS, la réponse dit explicitement que commentaires, tendance ou synthèse ne sont pas accessibles à l'utilisateur. Dire qu'il n'y a « pas de commentaire » ou « aucune donnée » pour ces territoires est non conforme.",
    applicable: (evidence) => evidence.maskedTerritories.length > 0,
  }),
];

/**
 * Une grille : le socle, puis les critères de la famille. `omit` retire un
 * critère du socle qui n'a pas de sens pour la suite (la restriction sur une
 * comparaison qui ne demande que des taux, jamais masqués).
 */
export function grid({
  family,
  matter,
  criteria,
  omit = [],
}: {
  family: string;
  matter: MatterKind;
  criteria: Criterion[];
  omit?: string[];
}): Grid {
  const all = [
    ...BASE.filter((criterion) => !omit.includes(criterion.id)),
    ...criteria,
  ];
  const ids = all.map((criterion) => criterion.id);
  const doublons = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (doublons.length > 0) {
    throw new Error(
      `Critères en double dans la grille ${family} : ${doublons.join(", ")}`,
    );
  }
  return { family, matter, criteria: all };
}
