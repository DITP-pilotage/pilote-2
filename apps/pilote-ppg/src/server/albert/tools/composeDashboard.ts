import { tool } from "ai";
import { z } from "zod";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import {
  DEFAULT_WIDTHS,
  type WidgetType,
} from "@/server/albert/tools/composeDashboardLayout";

export { DEFAULT_WIDTHS, type WidgetType };

const jalonSchema = z
  .number()
  .int()
  .min(2022)
  .max(new Date().getFullYear())
  .describe("Année du jalon (ex: 2024, 2025)");

const territoireCodeSchema = z
  .string()
  .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)");

const chantierIdSchema = z
  .string()
  .describe("Identifiant du chantier (ex: CH-001)");

const mailleSchema = z
  .enum(["regionale", "departementale"])
  .describe(
    "Maille cartographique — enum de périmètre (zoom), pas de nature sémantique.",
  );

const widgetTauxAvancementTerritoire = z
  .object({
    type: z.literal("widget_taux_avancement_territoire"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(1), z.literal(2)])
      .optional()
      .describe("default_width=1, allowed_widths=[1,2]"),
  })
  .strict();

const widgetMedianeAvancementTerritoire = z
  .object({
    type: z.literal("widget_mediane_avancement_territoire"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(1), z.literal(2)])
      .optional()
      .describe("default_width=1, allowed_widths=[1,2]"),
  })
  .strict();

const widgetNombreChantiersEnRetard = z
  .object({
    type: z.literal("widget_nombre_chantiers_en_retard"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(1), z.literal(2)])
      .optional()
      .describe("default_width=1, allowed_widths=[1,2]"),
  })
  .strict();

const widgetNombreChantiersEnDifficulte = z
  .object({
    type: z.literal("widget_nombre_chantiers_en_difficulte"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(1), z.literal(2)])
      .optional()
      .describe("default_width=1, allowed_widths=[1,2]"),
  })
  .strict();

const widgetValeursRemarquablesAvancement = z
  .object({
    type: z.literal("widget_valeurs_remarquables_avancement"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(2), z.literal(3), z.literal(4)])
      .optional()
      .describe("default_width=2, allowed_widths=[2,3,4]"),
  })
  .strict();

const widgetTableauIndicateursChantier = z
  .object({
    type: z.literal("widget_tableau_indicateurs_chantier"),
    chantier_id: chantierIdSchema,
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .literal(4)
      .optional()
      .describe("default_width=4, allowed_widths=[4]"),
  })
  .strict();

const widgetListeChantiersEnRetard = z
  .object({
    type: z.literal("widget_liste_chantiers_en_retard"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(2), z.literal(4)])
      .optional()
      .describe("default_width=2, allowed_widths=[2,4]"),
  })
  .strict();

const widgetListeChantiersEnDifficulte = z
  .object({
    type: z.literal("widget_liste_chantiers_en_difficulte"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(2), z.literal(4)])
      .optional()
      .describe("default_width=2, allowed_widths=[2,4]"),
  })
  .strict();

const widgetCartographieTauxAvancement = z
  .object({
    type: z.literal("widget_cartographie_taux_avancement"),
    maille: mailleSchema,
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(2), z.literal(3), z.literal(4)])
      .optional()
      .describe("default_width=2, allowed_widths=[2,3,4]"),
  })
  .strict();

const widgetCartographieMeteo = z
  .object({
    type: z.literal("widget_cartographie_meteo"),
    maille: mailleSchema,
    territoire_code: territoireCodeSchema,
    chantier_id: chantierIdSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(2), z.literal(3), z.literal(4)])
      .optional()
      .describe("default_width=2, allowed_widths=[2,3,4]"),
  })
  .strict();

const widgetCartographiePropositionsValeurAvancement = z
  .object({
    type: z.literal("widget_cartographie_propositions_valeur_avancement"),
    maille: mailleSchema,
    territoire_code: territoireCodeSchema,
    chantier_id: chantierIdSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(2), z.literal(3), z.literal(4)])
      .optional()
      .describe("default_width=2, allowed_widths=[2,3,4]"),
  })
  .strict();

const widgetParagraph = z
  .object({
    type: z.literal("widget_paragraph"),
    contenu: z
      .array(z.string())
      .min(1)
      .describe(
        "Tableau de paragraphes. Chaque élément = un paragraphe séparé. JAMAIS de saut de ligne dans un élément.",
      ),
    variant: z
      .enum(["default", "warning"])
      .optional()
      .describe(
        "default = neutre, warning = incohérence détectée (ex: chantier en retard mais météo favorable).",
      ),
    width: z
      .union([z.literal(2), z.literal(4)])
      .optional()
      .describe("default_width=4, allowed_widths=[2,4]"),
  })
  .strict();

const widgetTitreSection = z
  .object({
    type: z.literal("widget_titre_section"),
    titre: z
      .string()
      .min(1)
      .max(120)
      .describe(
        "Titre de section — AUCUN chiffre (ni %, ni points). Court et descriptif.",
      ),
    description: z
      .string()
      .max(500)
      .optional()
      .describe(
        "Description facultative — AUCUN chiffre (ni %, ni points). 2-3 phrases max.",
      ),
    width: z
      .union([z.literal(2), z.literal(4)])
      .optional()
      .describe("default_width=4, allowed_widths=[2,4]"),
  })
  .strict();

const widgetInputSchema = z
  .discriminatedUnion("type", [
    widgetTauxAvancementTerritoire,
    widgetMedianeAvancementTerritoire,
    widgetNombreChantiersEnRetard,
    widgetNombreChantiersEnDifficulte,
    widgetValeursRemarquablesAvancement,
    widgetTableauIndicateursChantier,
    widgetListeChantiersEnRetard,
    widgetListeChantiersEnDifficulte,
    widgetCartographieTauxAvancement,
    widgetCartographieMeteo,
    widgetCartographiePropositionsValeurAvancement,
    widgetTitreSection,
    widgetParagraph,
  ])
  .describe(
    "Widget du dashboard. Le type est l'intention métier. Aucune valeur chiffrée n'est jamais passée — uniquement des références (territoire_code, chantier_id, jalon, maille). Les valeurs sont résolues au rendu côté client.",
  );

const containerInputSchema = z
  .object({
    widgets: z
      .array(widgetInputSchema)
      .min(1)
      .max(12)
      .describe(
        "Widgets du container, placés sur un grid interne 4 colonnes selon leur largeur.",
      ),
  })
  .strict();

export const composeDashboardInputSchema = z.object({
  titre: z
    .string()
    .min(1)
    .max(120)
    .describe("Titre du dashboard, clair et descriptif"),
  containers: z
    .array(containerInputSchema)
    .min(1)
    .max(30)
    .describe(
      "Liste ordonnée des containers. Les containers sont empilés verticalement et occupent chacun la pleine largeur du dashboard.",
    ),
});

export type ComposeDashboardInput = z.infer<typeof composeDashboardInputSchema>;
export type WidgetDefinition = z.infer<typeof widgetInputSchema>;
export type ContainerDefinition = z.infer<typeof containerInputSchema>;

export type ComposeDashboardOutput = {
  titre: string;
  containers: ContainerDefinition[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Le dashboard a été composé et sera affiché visuellement sous forme de widgets dans l'interface.
Ne reproduis JAMAIS de valeurs chiffrées dans ta réponse textuelle (les chiffres sont résolus au rendu côté client).
Tu peux ajouter une phrase courte d'introduction ("Voici le dashboard demandé.") mais pas de commentaire sur les chiffres.
Si l'utilisateur demande à modifier le dashboard, rappelle compose_dashboard avec une nouvelle définition complète qui reprend les containers à conserver et applique les changements.`;

const FORBIDDEN_NUMBER_PATTERN = /\d+\s*(?:%|(?:points?|pts)\b)/i;

function findForbiddenNumber(text: string | undefined): string | null {
  if (!text) return null;
  const match = FORBIDDEN_NUMBER_PATTERN.exec(text);
  return match ? match[0] : null;
}

export function createComposeDashboardTool() {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    const territoiresAccessibles = habilitations.lecture.territoires;

    return tool({
      description: `Compose un tableau de bord dynamique à partir d'une liste de containers de widgets. Uniquement des références (territoire_code, chantier_id, jalon, maille), jamais de valeurs chiffrées. Les valeurs sont résolues au rendu côté client.`,
      inputSchema: composeDashboardInputSchema,
      execute: async (input): Promise<ComposeDashboardOutput> => {
        for (const container of input.containers) {
          for (const widget of container.widgets) {
            if (
              "territoire_code" in widget &&
              !territoiresAccessibles.includes(widget.territoire_code)
            ) {
              throw new Error(
                `Accès non autorisé au territoire ${widget.territoire_code}. Choisis un territoire dans la liste des territoires accessibles.`,
              );
            }

            if (widget.type === "widget_titre_section") {
              const forbidden =
                findForbiddenNumber(widget.titre) ??
                findForbiddenNumber(widget.description);
              if (forbidden !== null) {
                throw new Error(
                  `Le widget_titre_section ne doit contenir aucune valeur chiffrée ("${forbidden}"). Utilise un widget KPI atomique pour afficher un chiffre.`,
                );
              }
            }
          }
        }

        return {
          titre: input.titre,
          containers: input.containers,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
