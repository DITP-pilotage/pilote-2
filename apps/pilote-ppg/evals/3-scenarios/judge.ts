import { z } from "zod";
import type { Evidence } from "./evidence";
import type { JudgedCriterion } from "./grid";

/**
 * Le juge tourne sur un modèle DIFFÉRENT de celui de production. Mesure du
 * spike : les alias `openweight-*` ne sont pas listés par /v1/models mais
 * pointent vers des modèles du catalogue. À température 0 et seed fixe,
 * `openweight-large` et `openai/gpt-oss-120b` rendent des sorties identiques
 * sur 2 prompts sur 3 : prendre gpt-oss-120b reviendrait à faire s'auto-noter
 * le modèle de production. `deepseek-v4-flash` diverge sur tous les prompts
 * testés.
 */
export const JUDGE_MODEL = "deepseek-v4-flash";

export type Verdict = Record<string, { conforme: boolean; preuve: string }>;

/**
 * La preuve AVANT le verdict : le modèle écrit dans l'ordre du schéma. Avec
 * le booléen en premier, il tranchait puis justifiait, et la calibration du
 * 30/09 a relevé des preuves « non conforme » sous des verdicts conformes.
 */
export const rawVerdictSchema = z.object({
  verdicts: z.array(
    z.object({
      critere: z.string().describe("Identifiant exact du critère, recopié."),
      preuve: z
        .string()
        .describe(
          "Extrait cité de la réponse, ou ce qui manque, en une phrase. À écrire AVANT de décider.",
        ),
      conforme: z
        .boolean()
        .describe("La conclusion de la preuve qui précède, et rien d'autre."),
    }),
  ),
});

export const JUDGE_SYSTEM = `Tu vérifies la conformité des réponses d'Albert, l'assistant de PILOTE qui analyse les chantiers prioritaires du gouvernement pour des agents publics.

Tu ne notes pas la qualité en général. Tu vérifies une liste fermée de critères, chacun tiré d'une règle écrite du prompt d'Albert.

Règles :
- Juge chaque critère indépendamment des autres. Un défaut ne compte que pour le critère qu'il concerne.
- Appuie-toi sur la FICHE DE VÉRITÉ et sur les DONNÉES REÇUES PAR L'ASSISTANT, jamais sur tes propres connaissances.
- Un critère est conforme ou non conforme, sans intermédiaire.
- Pour chaque critère, écris d'abord la preuve : un extrait de la matière jugée, ou ce qui manque précisément. Décide ensuite : le verdict suit la preuve, jamais l'inverse.
- Un défaut qui relève d'un autre critère ne rend pas celui-ci non conforme.
- Rends un verdict pour chaque critère listé, et seulement pour eux, en recopiant son identifiant.`;

function sansInstructions(output: unknown): unknown {
  if (Array.isArray(output)) return output.map(sansInstructions);
  if (output && typeof output === "object") {
    return Object.fromEntries(
      Object.entries(output)
        .filter(([key]) => key !== "_output_instructions")
        .map(([key, value]) => [key, sansInstructions(value)]),
    );
  }
  return output;
}

export function buildJudgePrompt({
  evidence,
  criteria,
}: {
  evidence: Evidence;
  criteria: JudgedCriterion[];
}): string {
  const conversation =
    evidence.conversation.length > 0
      ? [
          `CONVERSATION PRÉCÉDENTE :`,
          ...evidence.conversation.flatMap((tour) => [
            `Utilisateur : ${tour.question}`,
            `Assistant : ${tour.answer}`,
          ]),
          ``,
        ]
      : [];

  const tableau =
    evidence.tableTerritories.length > 0
      ? [
          `TERRITOIRES ATTENDUS DANS LE TABLEAU : ${evidence.tableTerritories
            .map((code) => {
              const nom = evidence.truth.territoires.find(
                (territoire) => territoire.code === code,
              )?.nom;
              return nom ? `${nom} (${code})` : code;
            })
            .join(", ")}`,
          ``,
        ]
      : [];

  return [
    ...conversation,
    `DEMANDE DE L'UTILISATEUR (profil ${evidence.profile}, Territoire courant : ${evidence.currentTerritory}) :`,
    evidence.question,
    ``,
    `OUTILS APPELÉS PAR L'ASSISTANT :`,
    JSON.stringify(evidence.toolCalls, null, 2),
    ``,
    `DONNÉES REÇUES PAR L'ASSISTANT (seule source légitime de chiffres) :`,
    JSON.stringify(
      evidence.toolResults.map((result) => ({
        toolName: result.toolName,
        output: sansInstructions(result.output),
      })),
      null,
      2,
    ),
    ``,
    `TERRITOIRES MASQUÉS (hors périmètre de l'utilisateur) : ${evidence.maskedTerritories.join(", ") || "aucun"}`,
    ``,
    ...tableau,
    `FICHE DE VÉRITÉ (ce que la réponse doit couvrir) :`,
    JSON.stringify(sansInstructions(evidence.truth), null, 2),
    ``,
    `MATIÈRE À JUGER :`,
    evidence.matter,
    ``,
    `CRITÈRES :`,
    ...criteria.map(
      (criterion) =>
        `- « ${criterion.id} » (règle : ${criterion.rule}) : ${criterion.instruction}`,
    ),
  ].join("\n");
}

/**
 * Un critère que le juge a oublié est non conforme : un verdict par défaut
 * favorable ferait monter un score sur un silence.
 */
export function toVerdict({
  criteria,
  raw,
}: {
  criteria: JudgedCriterion[];
  raw: z.infer<typeof rawVerdictSchema>;
}): Verdict {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const found = raw.verdicts.find(
        (verdict) => verdict.critere === criterion.id,
      );
      return [
        criterion.id,
        found
          ? { conforme: found.conforme, preuve: found.preuve }
          : { conforme: false, preuve: "absent du verdict" },
      ];
    }),
  );
}
