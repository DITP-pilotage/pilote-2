import { z } from "zod";
import type { Evidence } from "./evidence";
import type { JudgedCriterion } from "./criterion";

/**
 * Le juge tourne sur un modèle DIFFÉRENT de celui de production. Mesure du
 * spike : les alias `openweight-*` ne sont pas listés par /v1/models mais
 * pointent vers des modèles du catalogue. À température 0 et seed fixe,
 * `openweight-large` et `openai/gpt-oss-120b` rendent des sorties identiques
 * sur 2 prompts sur 3 : prendre gpt-oss-120b reviendrait à faire s'auto-noter
 * le modèle de production. `deepseek-v4-flash` divergeait sur tous les
 * prompts testés, mais la clé du quota de production n'y a pas accès :
 * `mistral-medium-3-5` est le plus gros modèle de son catalogue hors de la
 * famille gpt-oss.
 */
export const JUDGE_MODEL = "mistral-medium-3-5";

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
          "Extrait cité entre « » de la MATIÈRE À JUGER, ou « absent de la matière » suivi de ce qui manque. Jamais un extrait des données reçues ou de la fiche. À écrire AVANT de décider.",
        ),
      verification: z
        .string()
        .describe(
          "Confronte la preuve aux références : refais le calcul, compare au commentaire reçu, vérifie chaque chantier ou territoire exigé. Conclus par le défaut précis trouvé, ou « aucun défaut ».",
        ),
      conforme: z
        .boolean()
        .describe(
          "La conclusion de la vérification qui précède, et rien d'autre : false seulement si elle nomme un défaut précis.",
        ),
    }),
  ),
});

export const JUDGE_SYSTEM = `Tu vérifies la conformité des réponses d'Albert, l'assistant de PILOTE qui analyse les chantiers prioritaires du gouvernement pour des agents publics.

Tu ne notes pas la qualité en général. Tu vérifies une liste fermée de critères, chacun tiré d'une règle écrite du prompt d'Albert.

Deux sortes de blocs, à ne jamais confondre :
- La MATIÈRE À JUGER, entre « DÉBUT DE LA MATIÈRE » et « FIN DE LA MATIÈRE » : ce qu'Albert a produit. C'est la seule chose que tu juges.
- Les RÉFÉRENCES (demande, outils appelés, données reçues, territoires masqués, territoires attendus, fiche de vérité) : ce qu'Albert savait ou devait couvrir. Elles servent à comparer, jamais à prouver qu'un élément figure dans la réponse. Un élément présent dans les références mais absent de la matière est ABSENT. Une absence n'est un défaut que si le critère exige cet élément : condenser, résumer, ne pas tout reprendre est conforme, sauf si le critère dit le contraire.

Règles :
- Juge chaque critère indépendamment des autres. Un défaut ne compte que pour le critère qu'il concerne.
- Appuie-toi sur les références, jamais sur tes propres connaissances.
- Un critère est conforme ou non conforme, sans intermédiaire.
- Pour chaque critère, écris d'abord la preuve : un extrait de la MATIÈRE cité entre « », ou « absent de la matière » et ce qui manque. Puis la vérification : confronte cette preuve aux références (calcul refait, commentaire comparé, chaque élément exigé contrôlé). Décide ensuite : le verdict suit la vérification, jamais l'inverse.
- Non conforme exige un défaut précis, nommé dans la preuve : un élément exigé absent, ou un passage cité qui contredit le critère. Si la preuve cite ce que le critère exige, sans défaut, le critère est conforme.
- Quand un critère exige un élément pour chaque chantier, section ou territoire, cherche-le dans la matière pour chacun, un par un. Un seul manquant rend le critère non conforme : nomme-le dans la preuve.
- Un défaut qui relève d'un autre critère ne rend pas celui-ci non conforme.
- Rends un verdict pour chaque critère listé, et seulement pour eux, en recopiant son identifiant.`;

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
          `TERRITOIRES QUE LE TABLEAU DE LA RÉPONSE DOIT CONTENIR (référence, à comparer au tableau de la matière) : ${evidence.tableTerritories
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
        output: result.output,
      })),
      null,
      2,
    ),
    ``,
    `TERRITOIRES MASQUÉS (hors périmètre de l'utilisateur) : ${evidence.maskedTerritories.join(", ") || "aucun"}`,
    ``,
    ...tableau,
    `FICHE DE VÉRITÉ (ce que la réponse doit couvrir) :`,
    JSON.stringify(evidence.truth, null, 2),
    ``,
    `MATIÈRE À JUGER :`,
    `=== DÉBUT DE LA MATIÈRE ===`,
    evidence.matter,
    `=== FIN DE LA MATIÈRE ===`,
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
          ? {
              conforme: found.conforme,
              preuve: `${found.preuve} — ${found.verification}`,
            }
          : { conforme: false, preuve: "absent du verdict" },
      ];
    }),
  );
}
