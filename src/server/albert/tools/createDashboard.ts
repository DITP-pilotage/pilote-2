import { generateText, Output, stepCountIs, tool } from "ai";
import { z } from "zod";
import {
  composeDashboardInputSchema,
  type ComposeDashboardInput,
  type ComposeDashboardOutput,
} from "@/server/albert/tools/composeDashboard";
import { buildDashboardSystemPrompt } from "@/server/albert/subagents/dashboardSystemPrompt";
import { Albert, withOptionalDevTools } from "@/server/albert/Albert";

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
): void {
  const territoireSet = new Set(allowedTerritoires);
  const jalonSet = new Set(allowedJalons);
  const chantierIdSet = allowedChantiers
    ? new Set(allowedChantiers.map((c) => c.id))
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

      if ("jalon" in widget && !jalonSet.has(widget.jalon)) {
        throw new Error(
          `Le subagent a utilisé un jalon non autorisé : ${widget.jalon}. Jalons autorisés : ${allowedJalons.join(", ")}`,
        );
      }

      if ("chantier_id" in widget) {
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

      if ("chantier_ids" in widget && Array.isArray(widget.chantier_ids)) {
        for (const id of widget.chantier_ids) {
          if (!chantierIdSet) {
            throw new Error(
              `Le subagent a utilisé des chantier_ids (${id}) alors qu'aucun n'a été fourni.`,
            );
          }
          if (!chantierIdSet.has(id)) {
            throw new Error(
              `Le subagent a utilisé un chantier_id non autorisé : ${id}. Chantiers autorisés : ${[...chantierIdSet].join(", ")}`,
            );
          }
        }
      }
    }
  }
}

function buildSubagentPrompt(
  task: string,
  territoireCodes: string[],
  jalons: number[],
  chantiers: ChantierContext[] | undefined,
): string {
  const contextLines = [
    "<context>",
    `territoire_codes: ${JSON.stringify(territoireCodes)}`,
    `jalons: ${JSON.stringify(jalons)}`,
    ...(chantiers?.length ? [`chantiers: ${JSON.stringify(chantiers)}`] : []),
    "</context>",
  ];

  return `${task}\n\n${contextLines.join("\n")}`;
}

export function createCreateDashboardTool() {
  const albertProvider = Albert.createProvider();

  return tool({
    description: `Délègue la composition d'un dashboard à un agent spécialisé.
Utilise ce tool quand l'utilisateur demande un dashboard, un cockpit,
un tableau de bord visuel, ou d'afficher les indicateurs d'un chantier.
Fournis la description de ce que l'utilisateur veut visualiser ainsi que les identifiants résolus (territoire_codes, jalons, chantiers).`,
    inputSchema: createDashboardInputSchema,
    execute: async (
      { task, territoire_codes, jalons, chantiers },
      { abortSignal },
    ) => {
      const result = await generateText({
        model: withOptionalDevTools(albertProvider.chat("openweight-large")),
        system: buildDashboardSystemPrompt(),
        prompt: buildSubagentPrompt(task, territoire_codes, jalons, chantiers),
        stopWhen: stepCountIs(5),
        output: Output.object({ schema: composeDashboardInputSchema }),
        abortSignal,
      });

      if (!result.output) {
        throw new Error("Le subagent n'a pas pu composer de dashboard.");
      }

      validateDashboardIdentifiers(
        result.output,
        territoire_codes,
        jalons,
        chantiers,
      );

      return {
        titre: result.output.titre,
        containers: result.output.containers,
        _output_instructions: OUTPUT_INSTRUCTIONS,
      };
    },
  });
}
