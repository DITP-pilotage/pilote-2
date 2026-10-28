import type { Evidence } from "./evidence";
import {
  checkChantierFormat,
  checkFrench,
  checkNoHtml,
  checkNoMeteo,
  checkNoMeteoCode,
  checkNoToolName,
  type CheckResult,
} from "./mechanicalChecks";

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
  chantierFormat: "Format des chantiers",
  noOpinion: "Pas d'opinion",
  exactFigures: "Chiffres exacts",
  restriction: "Restriction signalée",
  french: "Réponse en français",
  noMeteo: "Pas de météo",
  noHtml: "Pas de HTML",
} as const;

/**
 * Le socle : les « Règles fondamentales » du prompt, valables pour toute
 * réponse. Elles portent sur la matière, qui peut être un rapport ou un
 * dashboard décrit.
 */
const BASE: Criterion[] = [
  mechanical({
    id: BASE_IDS.noToolName,
    rule: "Règle 5 : n'expose ni nom d'outil, ni nom de champ",
    check: (evidence) => checkNoToolName({ text: evidence.matter }),
  }),
  mechanical({
    id: BASE_IDS.noMeteoCode,
    rule: "Règle 5 : aucun code interne, les niveaux de confiance en libellés (D1)",
    check: (evidence) => checkNoMeteoCode({ text: evidence.matter }),
  }),
  mechanical({
    id: BASE_IDS.chantierFormat,
    rule: "Rédiger : chaque chantier au format CH-XXX — Nom",
    check: (evidence) => checkChantierFormat({ text: evidence.matter }),
  }),
  // Sur la réponse du chat, pas sur la matière : celle d'un dashboard décrit
  // des widgets, pas du texte rédigé.
  mechanical({
    id: BASE_IDS.french,
    rule: "Langue : réponds toujours en français, y compris après un appel d'outil (PIL-1900)",
    check: (evidence) => checkFrench({ text: evidence.answer }),
  }),
  // Sans objet quand l'utilisateur parle lui-même de météo : la réponse peut
  // alors reprendre son mot.
  mechanical({
    id: BASE_IDS.noMeteo,
    rule: "PIL-1900, D1 : aucune réponse ne mentionne la météo, seulement le niveau de confiance",
    check: (evidence) => checkNoMeteo({ text: evidence.answer }),
    applicable: (evidence) => !/m[ée]t[ée]o/i.test(evidence.question),
  }),
  mechanical({
    id: BASE_IDS.noHtml,
    rule: "Le chat n'affiche pas le HTML : aucune balise dans la réponse (revue PIL-1900)",
    check: (evidence) => checkNoHtml({ text: evidence.answer }),
  }),
  judged({
    id: BASE_IDS.noOpinion,
    rule: "Règle 4 : ni opinion, ni recommandation, ni causalité absente des données",
    instruction:
      "La réponse décrit les données sans conseiller, recommander, prioriser ni qualifier moralement. « Il conviendrait de », « il est urgent de », « la situation est préoccupante » sont non conformes. Une tendance factuelle (« les écarts se concentrent sur la santé ») est conforme.",
  }),
  judged({
    id: BASE_IDS.exactFigures,
    rule: "Règle 2 : ne cite que des données renvoyées par les outils",
    instruction:
      "Chaque nombre écrit en chiffres dans la matière (taux, médiane, écart, valeur d'indicateur) figure dans les DONNÉES REÇUES PAR L'ASSISTANT, ou est l'écart entre deux de ces valeurs. Un nombre introuvable ou faux est non conforme : cite-le dans la preuve. Ne sont pas des données : les seuils des règles (« 10 points »), les années de jalon, les codes de chantier ou de territoire. Le sens d'une variation et la position face à la médiane relèvent d'autres critères.",
  }),
  judged({
    id: BASE_IDS.restriction,
    rule: "Règle 6 : une donnée masquée par restriction d'accès n'est pas une donnée absente",
    instruction:
      "Pour les territoires listés comme MASQUÉS, la réponse dit explicitement que commentaires, tendance ou synthèse ne sont pas accessibles à l'utilisateur. Dire qu'il n'y a « pas de commentaire » ou « aucune donnée » pour ces territoires est non conforme.",
    applicable: (evidence) => evidence.maskedTerritories.length > 0,
  }),
];

/**
 * Les critères d'un scénario : le socle, puis les siens. `omit` retire un
 * critère du socle qui n'a pas de sens pour le scénario (la restriction sur
 * une comparaison qui ne demande que des taux, jamais masqués).
 *
 * La liste vit dans un `.criteria.ts` à côté du scénario, et non dans son
 * `.eval.ts` : la calibration la juge à l'identique, et importer un
 * `.eval.ts` enregistrerait sa suite.
 */
export function withBase({
  criteria,
  omit = [],
}: {
  criteria: Criterion[];
  omit?: string[];
}): Criterion[] {
  const all = [
    ...BASE.filter((criterion) => !omit.includes(criterion.id)),
    ...criteria,
  ];
  const ids = all.map((criterion) => criterion.id);
  const doublons = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (doublons.length > 0) {
    throw new Error(`Critères en double : ${doublons.join(", ")}`);
  }
  return all;
}
