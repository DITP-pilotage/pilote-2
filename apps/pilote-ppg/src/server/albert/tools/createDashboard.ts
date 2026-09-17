import { tool } from "ai";
import { z } from "zod";
import {
  composeDashboardInputSchema,
  type ComposeDashboardInput,
  type ComposeDashboardOutput,
} from "@/server/albert/tools/composeDashboard";
import { buildDashboardSystemPrompt } from "@/server/albert/subagents/dashboardSystemPrompt";
import { Albert } from "@/server/albert/Albert";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";

const chantierContextSchema = z.object({
  id: z.string().describe("Identifiant du chantier (ex: CH-064)"),
  nom: z.string().describe("Nom complet du chantier"),
  statut: z
    .enum(["en_retard", "en_difficulte"])
    .optional()
    .describe("Statut du chantier si connu (en_retard ou en_difficulte)"),
  meteo: z
    .string()
    .optional()
    .describe("Météo du chantier (SOLEIL, COUVERT, NUAGE, ORAGE)"),
  commentaire: z
    .string()
    .optional()
    .describe("Commentaire de synthèse du chantier"),
});

export type ChantierContext = z.infer<typeof chantierContextSchema>;

const indicateurContextSchema = z.object({
  id: z.string().describe("Identifiant de l'indicateur (ex: IND-894)"),
  nom: z.string().describe("Nom de l'indicateur"),
  chantier_id: z
    .string()
    .describe("Identifiant du chantier auquel appartient l'indicateur"),
});

export type IndicateurContext = z.infer<typeof indicateurContextSchema>;

export const createDashboardInputSchema = z.object({
  task: z
    .string()
    .describe(
      "Description de ce que l'utilisateur veut visualiser (type de dashboard, niveau de détail).",
    ),
  territoire_codes: z
    .array(z.string())
    .min(1)
    .describe(
      "Codes des territoires concernés (ex: ['REG-76', 'DEPT-09']). OBLIGATOIRE.",
    ),
  jalons: z
    .array(z.number().int())
    .min(1)
    .describe(
      "Années des jalons pour le dashboard (ex: [2025, 2026]). Supporte le multi-jalon.",
    ),
  chantiers: z
    .array(chantierContextSchema)
    .optional()
    .describe(
      "Chantiers ciblés avec leur nom et statut. Uniquement si l'utilisateur cible des chantiers précis ou obtenus via un outil de données.",
    ),
  indicateur_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Identifiants IND-XXX des indicateurs dont l'utilisateur veut visualiser l'évolution en graphique (courbe). Formate un numéro seul en IND-<numéro>, ou résous-le via search_indicateurs si l'utilisateur décrit l'indicateur sans identifiant. Le nom et le chantier de rattachement sont résolus automatiquement.",
    ),
});

export type CreateDashboardOutput = ComposeDashboardOutput;

const OUTPUT_INSTRUCTIONS = `Le dashboard a été composé et sera affiché visuellement sous forme de widgets dans l'interface.
Ne reproduis JAMAIS de valeurs chiffrées dans ta réponse textuelle (les chiffres sont résolus au rendu côté client).
Tu peux ajouter une phrase courte d'introduction ("Voici le dashboard demandé.") mais pas de commentaire sur les chiffres.
Si l'utilisateur demande à modifier le dashboard, rappelle create_dashboard avec une nouvelle description.`;

export function validateDashboardIdentifiers(
  output: ComposeDashboardInput,
  allowedTerritoires: string[],
  allowedJalons: number[],
  allowedChantiers: ChantierContext[] | undefined,
  allowedIndicateurs: IndicateurContext[] | undefined,
): void {
  const territoireSet = new Set(allowedTerritoires);
  const jalonSet = new Set(allowedJalons);
  const chantierIdSet = allowedChantiers
    ? new Set(allowedChantiers.map((c) => c.id))
    : undefined;
  const indicateurChantierById = allowedIndicateurs
    ? new Map(allowedIndicateurs.map((i) => [i.id, i.chantier_id]))
    : undefined;

  for (const container of output.containers) {
    for (const widget of container.widgets) {
      if (
        "territoire_code" in widget &&
        !territoireSet.has(widget.territoire_code)
      ) {
        throw new Error(
          `Le subagent a utilisé un territoire non autorisé : ${widget.territoire_code}. Territoires autorisés : ${allowedTerritoires.join(", ")}`,
        );
      }

      if ("territoire_codes" in widget) {
        for (const territoireCode of widget.territoire_codes) {
          if (!territoireSet.has(territoireCode)) {
            throw new Error(
              `Le subagent a utilisé un territoire non autorisé : ${territoireCode}. Territoires autorisés : ${allowedTerritoires.join(", ")}`,
            );
          }
        }
      }

      if ("jalon" in widget && !jalonSet.has(widget.jalon)) {
        throw new Error(
          `Le subagent a utilisé un jalon non autorisé : ${widget.jalon}. Jalons autorisés : ${allowedJalons.join(", ")}`,
        );
      }

      if ("indicateur_id" in widget) {
        if (!indicateurChantierById) {
          throw new Error(
            `Le subagent a utilisé un indicateur_id (${widget.indicateur_id}) alors qu'aucun n'a été fourni.`,
          );
        }
        const chantierIdAttendu = indicateurChantierById.get(
          widget.indicateur_id,
        );
        if (chantierIdAttendu === undefined) {
          throw new Error(
            `Le subagent a utilisé un indicateur_id non autorisé : ${widget.indicateur_id}. Indicateurs autorisés : ${[...indicateurChantierById.keys()].join(", ")}`,
          );
        }
        if (
          "chantier_id" in widget &&
          widget.chantier_id !== chantierIdAttendu
        ) {
          throw new Error(
            `Le subagent a utilisé un chantier_id (${widget.chantier_id}) incohérent avec l'indicateur ${widget.indicateur_id} (chantier attendu : ${chantierIdAttendu}).`,
          );
        }
      } else if ("chantier_id" in widget) {
        if (!chantierIdSet) {
          throw new Error(
            `Le subagent a utilisé un chantier_id (${widget.chantier_id}) alors qu'aucun n'a été fourni.`,
          );
        }
        if (!chantierIdSet.has(widget.chantier_id)) {
          throw new Error(
            `Le subagent a utilisé un chantier_id non autorisé : ${widget.chantier_id}. Chantiers autorisés : ${[...chantierIdSet].join(", ")}`,
          );
        }
      }
    }
  }
}

async function resolveIndicateurs(
  indicateurIds: string[],
  chantiersAccessibles: string[],
  getIndicateurContexteQuery: GetIndicateurContexteQuery,
): Promise<IndicateurContext[]> {
  return Promise.all(
    indicateurIds.map(async (indicateurId) => {
      const contexte = await getIndicateurContexteQuery.execute({
        indicateurId,
      });

      if (!contexte) {
        throw new Error(`Indicateur introuvable : ${indicateurId}`);
      }

      if (!chantiersAccessibles.includes(contexte.chantier.id)) {
        throw new Error(
          `Accès non autorisé au chantier ${contexte.chantier.id}`,
        );
      }

      return {
        id: contexte.id,
        nom: contexte.nom,
        chantier_id: contexte.chantier.id,
      };
    }),
  );
}

function buildSubagentPrompt(
  task: string,
  territoireCodes: string[],
  jalons: number[],
  chantiers: ChantierContext[] | undefined,
  indicateurs: IndicateurContext[] | undefined,
): string {
  const contextLines = [
    "<context>",
    `territoire_codes: ${JSON.stringify(territoireCodes)}`,
    `jalons: ${JSON.stringify(jalons)}`,
    ...(chantiers?.length ? [`chantiers: ${JSON.stringify(chantiers)}`] : []),
    ...(indicateurs?.length
      ? [`indicateurs: ${JSON.stringify(indicateurs)}`]
      : []),
    "</context>",
  ];

  return `${task}\n\n${contextLines.join("\n")}`;
}

export function createCreateDashboardTool({
  getIndicateurContexteQuery,
}: {
  getIndicateurContexteQuery: GetIndicateurContexteQuery;
}) {
  return ({ chantiersAccessibles }: { chantiersAccessibles: string[] }) =>
    tool({
      description: `Délègue la composition d'un dashboard à un agent spécialisé.
Utilise ce tool quand l'utilisateur demande un dashboard, un cockpit,
un tableau de bord visuel, d'afficher les indicateurs d'un chantier, ou une courbe/un graphique d'évolution d'indicateur.
Fournis la description de ce que l'utilisateur veut visualiser ainsi que les identifiants résolus (territoire_codes, jalons, chantiers, indicateur_ids).`,
      inputSchema: createDashboardInputSchema,
      execute: async (
        { task, territoire_codes, jalons, chantiers, indicateur_ids },
        { abortSignal },
      ) => {
        const indicateurs = indicateur_ids
          ? await resolveIndicateurs(
              indicateur_ids,
              chantiersAccessibles,
              getIndicateurContexteQuery,
            )
          : undefined;

        const output = await Albert.generateStructuredOutput({
          systemPrompt: buildDashboardSystemPrompt(),
          prompt: buildSubagentPrompt(
            task,
            territoire_codes,
            jalons,
            chantiers,
            indicateurs,
          ),
          schema: composeDashboardInputSchema,
          abortSignal,
        });

        validateDashboardIdentifiers(
          output,
          territoire_codes,
          jalons,
          chantiers,
          indicateurs,
        );

        return {
          titre: output.titre,
          containers: output.containers,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
}
