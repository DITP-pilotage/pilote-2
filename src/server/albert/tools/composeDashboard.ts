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
      .union([z.literal(3), z.literal(4), z.literal(6)])
      .optional()
      .describe("default_width=3, allowed_widths=[3,4,6]"),
  })
  .strict();

const widgetMedianeAvancementTerritoire = z
  .object({
    type: z.literal("widget_mediane_avancement_territoire"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(3), z.literal(4), z.literal(6)])
      .optional()
      .describe("default_width=3, allowed_widths=[3,4,6]"),
  })
  .strict();

const widgetNombreChantiersEnRetard = z
  .object({
    type: z.literal("widget_nombre_chantiers_en_retard"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(3), z.literal(4), z.literal(6)])
      .optional()
      .describe("default_width=3, allowed_widths=[3,4,6]"),
  })
  .strict();

const widgetNombreChantiersEnDifficulte = z
  .object({
    type: z.literal("widget_nombre_chantiers_en_difficulte"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(3), z.literal(4), z.literal(6)])
      .optional()
      .describe("default_width=3, allowed_widths=[3,4,6]"),
  })
  .strict();

const widgetValeursRemarquablesAvancement = z
  .object({
    type: z.literal("widget_valeurs_remarquables_avancement"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(4), z.literal(6), z.literal(8)])
      .optional()
      .describe("default_width=6, allowed_widths=[4,6,8]"),
  })
  .strict();

const widgetTableauIndicateursChantier = z
  .object({
    type: z.literal("widget_tableau_indicateurs_chantier"),
    chantier_id: chantierIdSchema,
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .literal(12)
      .optional()
      .describe("default_width=12, allowed_widths=[12]"),
  })
  .strict();

const widgetListeChantiersEnRetard = z
  .object({
    type: z.literal("widget_liste_chantiers_en_retard"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(6), z.literal(12)])
      .optional()
      .describe("default_width=6, allowed_widths=[6,12]"),
  })
  .strict();

const widgetListeChantiersEnDifficulte = z
  .object({
    type: z.literal("widget_liste_chantiers_en_difficulte"),
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    width: z
      .union([z.literal(6), z.literal(12)])
      .optional()
      .describe("default_width=6, allowed_widths=[6,12]"),
  })
  .strict();

const widgetCartographieTauxAvancement = z
  .object({
    type: z.literal("widget_cartographie_taux_avancement"),
    maille: mailleSchema,
    territoire_code: territoireCodeSchema,
    jalon: jalonSchema,
    chantier_ids: z
      .array(chantierIdSchema)
      .min(1)
      .describe("Sous-ensemble de chantiers à agréger sur la carte."),
    width: z
      .union([z.literal(6), z.literal(8), z.literal(12)])
      .optional()
      .describe("default_width=12, allowed_widths=[6,8,12]"),
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
      .union([z.literal(6), z.literal(8), z.literal(12)])
      .optional()
      .describe("default_width=12, allowed_widths=[6,8,12]"),
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
      .union([z.literal(6), z.literal(8), z.literal(12)])
      .optional()
      .describe("default_width=12, allowed_widths=[6,8,12]"),
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
      .union([z.literal(6), z.literal(12)])
      .optional()
      .describe("default_width=12, allowed_widths=[6,12]"),
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
        "Widgets du container, placés sur un grid interne 12 colonnes selon leur largeur.",
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

const FORBIDDEN_NUMBER_PATTERN = /\d+\s*(%|points?|pts)\b/i;

function findForbiddenNumber(text: string | undefined): string | null {
  if (!text) return null;
  const match = FORBIDDEN_NUMBER_PATTERN.exec(text);
  return match ? match[0] : null;
}

export function createComposeDashboardTool() {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    const territoiresAccessibles = habilitations.lecture.territoires;

    return tool({
      description: `Compose un tableau de bord dynamique à partir d'une liste de containers de widgets nominalement nommés.

Tu n'embarques JAMAIS de chiffres dans tes paramètres : uniquement des références (territoire_code, chantier_id, jalon, maille). Les valeurs sont résolues au rendu côté client.

Utilise cet outil quand l'utilisateur demande explicitement de **construire**, **composer**, **assembler** ou **afficher** un tableau de bord, un cockpit, une vue personnalisée. Suis le flux 2 tours décrit dans le system prompt : si le périmètre minimum (territoire + jalon) est connu, compose directement ; sinon réponds en un seul message qui combine présentation des widgets et UNE seule question ouverte pour récupérer le périmètre manquant.

## Concept de container

Un dashboard est une liste ordonnée de containers **empilés verticalement**, chacun occupant la pleine largeur du dashboard (grid 12 colonnes). Chaque container contient ses propres widgets placés sur son grid interne 12 colonnes. L'ordre des containers détermine l'ordre vertical d'affichage.

## Catalogue de widgets (12 intentions métier nominales)

| Widget | Intention | Paramètres | default_width | allowed_widths |
|---|---|---|---|---|
| widget_taux_avancement_territoire | TA agrégé d'un territoire | territoire_code, jalon | 3 | [3,4,6] |
| widget_mediane_avancement_territoire | Médiane du TA sur les sous-territoires | territoire_code, jalon | 3 | [3,4,6] |
| widget_nombre_chantiers_en_retard | Nombre de chantiers en retard | territoire_code, jalon | 3 | [3,4,6] |
| widget_nombre_chantiers_en_difficulte | Nombre de chantiers en difficulté (météo ORAGE/NUAGE) | territoire_code, jalon | 3 | [3,4,6] |
| widget_valeurs_remarquables_avancement | Min/médiane/max du TA sur les sous-territoires | territoire_code, jalon | 6 | [4,6,8] |
| widget_tableau_indicateurs_chantier | VI/VA/VC/TA d'un chantier | chantier_id, territoire_code, jalon | 12 | [12] |
| widget_liste_chantiers_en_retard | Liste compacte chantiers en retard (écart ≤ -10 pts) | territoire_code, jalon | 6 | [6,12] |
| widget_liste_chantiers_en_difficulte | Liste compacte chantiers en difficulté (météo ORAGE/NUAGE) | territoire_code, jalon | 6 | [6,12] |
| widget_cartographie_taux_avancement | Carte de France du TA par territoire | maille, territoire_code, jalon, chantier_ids | 12 | [6,8,12] |
| widget_cartographie_meteo | Carte de France des météos par territoire | maille, territoire_code, chantier_id, jalon | 12 | [6,8,12] |
| widget_cartographie_propositions_valeur_avancement | Carte de France des propositions de valeurs d'avancement (PVA) d'un chantier | maille, territoire_code, chantier_id, jalon | 12 | [6,8,12] |
| widget_titre_section | Titre + description courte (AUCUN chiffre) | titre, description? | 12 | [6,12] |

Le **nom** du widget est l'intention. Aucun enum de métrique, aucun row_group, aucun filler.

## Structure recommandée d'un cockpit territoire

1. Un container avec un \`widget_titre_section\`.
2. Un container avec \`widget_taux_avancement_territoire\` + \`widget_nombre_chantiers_en_retard\` + \`widget_valeurs_remarquables_avancement\` (trois widgets compacts sur une rangée).
3. Un container avec \`widget_cartographie_taux_avancement\`.
4. Un container avec \`widget_liste_chantiers_en_retard\` et \`widget_liste_chantiers_en_difficulte\` côte à côte en width 6.

Règle générale : un widget solo dans un container de 12 colonnes gâche de la place si sa default_width est inférieure à 12. Regroupe les widgets compatibles dans un seul container pour remplir naturellement la largeur.

## Règles JSON strictes

Tu produis du JSON STRICT conforme au schéma. INTERDIT :
- Aucun commentaire (ni \`//\` ni \`/* */\`).
- Aucune virgule traînante.
- Aucune clé non quotée.
- Aucun texte explicatif en dehors de l'objet JSON racine.

Ne copie JAMAIS des fragments "pseudo-code" ou des commentaires explicatifs dans ta réponse : produis uniquement l'objet JSON valide attendu par le schéma.`,
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
