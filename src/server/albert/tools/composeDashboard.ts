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
    chantier_ids: z
      .array(chantierIdSchema)
      .min(1)
      .describe("Sous-ensemble de chantiers à agréger sur la carte."),
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
      description: `Compose un tableau de bord dynamique à partir d'une liste de containers de widgets nominalement nommés.

Tu n'embarques JAMAIS de chiffres dans tes paramètres : uniquement des références (territoire_code, chantier_id, jalon, maille). Les valeurs sont résolues au rendu côté client.

Utilise cet outil quand l'utilisateur demande explicitement de **construire**, **composer**, **assembler** ou **afficher** un tableau de bord, un cockpit, une vue personnalisée. Suis le flux 2 tours décrit dans le system prompt : si le périmètre minimum (territoire + jalon) est connu, compose directement ; sinon réponds en un seul message qui combine présentation des widgets et UNE seule question ouverte pour récupérer le périmètre manquant.

## Concept de container

Un dashboard est une liste ordonnée de containers **empilés verticalement**, chacun occupant la pleine largeur du dashboard (grid 4 colonnes). Chaque container contient ses propres widgets placés sur son grid interne 4 colonnes. L'ordre des containers détermine l'ordre vertical d'affichage.

## Catalogue de widgets (12 intentions métier nominales)

| Widget | Intention | Paramètres | default_width | allowed_widths |
|---|---|---|---|---|
| widget_taux_avancement_territoire | TA agrégé d'un territoire | territoire_code, jalon | 1 | [1,2] |
| widget_mediane_avancement_territoire | Médiane du TA sur les sous-territoires | territoire_code, jalon | 1 | [1,2] |
| widget_nombre_chantiers_en_retard | Nombre de chantiers en retard | territoire_code, jalon | 1 | [1,2] |
| widget_nombre_chantiers_en_difficulte | Nombre de chantiers en difficulté (météo ORAGE/NUAGE) | territoire_code, jalon | 1 | [1,2] |
| widget_valeurs_remarquables_avancement | Min/médiane/max du TA sur les sous-territoires | territoire_code, jalon | 2 | [2,3,4] |
| widget_tableau_indicateurs_chantier | VI/VA/VC/TA d'un chantier | chantier_id, territoire_code, jalon | 4 | [4] |
| widget_liste_chantiers_en_retard | Liste compacte chantiers en retard (écart ≤ -10 pts) | territoire_code, jalon | 2 | [2,4] |
| widget_liste_chantiers_en_difficulte | Liste compacte chantiers en difficulté (météo ORAGE/NUAGE) | territoire_code, jalon | 2 | [2,4] |
| widget_cartographie_taux_avancement | Carte de France du TA par territoire | maille, territoire_code, jalon, chantier_ids | 2 | [2,3,4] |
| widget_cartographie_meteo | Carte de France des météos par territoire | maille, territoire_code, chantier_id, jalon | 2 | [2,3,4] |
| widget_cartographie_propositions_valeur_avancement | Carte de France des propositions de valeurs d'avancement (PVA) d'un chantier | maille, territoire_code, chantier_id, jalon | 2 | [2,3,4] |
| widget_titre_section | Titre + description courte (AUCUN chiffre) | titre, description? | 4 | [2,4] |

Le **nom** du widget est l'intention. Aucun enum de métrique, aucun row_group, aucun filler.

## Structure recommandée d'un cockpit territoire

1. Un container avec un \`widget_titre_section\`.
2. Un container avec \`widget_taux_avancement_territoire\` + \`widget_nombre_chantiers_en_retard\` + \`widget_valeurs_remarquables_avancement\` (trois widgets compacts sur une rangée : 1+1+2=4).
3. Un container avec \`widget_cartographie_taux_avancement\` en width 4.
4. Un container avec \`widget_liste_chantiers_en_retard\` et \`widget_liste_chantiers_en_difficulte\` côte à côte en width 2.

Règle générale : un widget solo dans un container de 4 colonnes gâche de la place si sa default_width est inférieure à 4. Regroupe les widgets compatibles dans un seul container pour remplir naturellement la largeur.

## Règles JSON strictes

Tu produis du JSON STRICT conforme au schéma. INTERDIT :
- Aucun commentaire (ni \`//\` ni \`/* */\`).
- Aucune virgule traînante.
- Aucune clé non quotée.
- Aucun texte explicatif en dehors de l'objet JSON racine.

Ne copie JAMAIS des fragments "pseudo-code" ou des commentaires explicatifs dans ta réponse : produis uniquement l'objet JSON valide attendu par le schéma.

## Exemples de dashboards valides

Les trois exemples ci-dessous illustrent les principaux patterns de composition. **Valeurs illustratives** : adapte systématiquement \`territoire_code\`, \`jalon\`, \`chantier_id\` et \`chantier_ids\` aux paramètres réels du contexte utilisateur. Ne réutilise jamais \`REG-76\`, \`DEPT-42\` ou \`2026\` par défaut.

### Exemple 1 — Cockpit synthétique d'un territoire
Pattern : titre, rangée de KPI compacts (1+1+2=4), carte pleine largeur, deux listes côte à côte.
\`\`\`json
{"titre":"Dashboard Occitanie – 2026","containers":[{"widgets":[{"type":"widget_titre_section","titre":"Occitanie – Synthèse 2026","description":"Vue d'ensemble du taux d'avancement et des alertes","width":4}]},{"widgets":[{"type":"widget_taux_avancement_territoire","territoire_code":"REG-76","jalon":2026,"width":1},{"type":"widget_nombre_chantiers_en_retard","territoire_code":"REG-76","jalon":2026,"width":1},{"type":"widget_valeurs_remarquables_avancement","territoire_code":"REG-76","jalon":2026,"width":2}]},{"widgets":[{"type":"widget_cartographie_taux_avancement","maille":"regionale","territoire_code":"REG-76","jalon":2026,"chantier_ids":["CH-071","CH-121","CH-078","CH-166","CH-004","CH-139"],"width":4}]},{"widgets":[{"type":"widget_liste_chantiers_en_retard","territoire_code":"REG-76","jalon":2026,"width":2},{"type":"widget_liste_chantiers_en_difficulte","territoire_code":"REG-76","jalon":2026,"width":2}]}]}
\`\`\`

### Exemple 2 — Ventilation par sous-territoires
Pattern : pour chaque sous-territoire, un container titre + un container avec 3 KPI sur une rangée (1+1+1=3, la 4e colonne reste vide). Le bloc *(titre de section + rangée de 3 KPI)* est à **répéter pour chaque sous-territoire demandé** (l'exemple n'en montre que 2 pour rester court, mais tu dois en générer autant que nécessaire).
\`\`\`json
{"titre":"Dashboard Occitanie – Départements 2026","containers":[{"widgets":[{"type":"widget_titre_section","titre":"Département 09 – Ariège","width":4}]},{"widgets":[{"type":"widget_taux_avancement_territoire","territoire_code":"DEPT-09","jalon":2026,"width":1},{"type":"widget_nombre_chantiers_en_retard","territoire_code":"DEPT-09","jalon":2026,"width":1},{"type":"widget_nombre_chantiers_en_difficulte","territoire_code":"DEPT-09","jalon":2026,"width":1}]},{"widgets":[{"type":"widget_titre_section","titre":"Département 11 – Aude","width":4}]},{"widgets":[{"type":"widget_taux_avancement_territoire","territoire_code":"DEPT-11","jalon":2026,"width":1},{"type":"widget_nombre_chantiers_en_retard","territoire_code":"DEPT-11","jalon":2026,"width":1},{"type":"widget_nombre_chantiers_en_difficulte","territoire_code":"DEPT-11","jalon":2026,"width":1}]}]}
\`\`\`

### Exemple 3 — Focus chantier sur un territoire
Pattern : titre du chantier, tableau d'indicateurs, puis cartographies thématiques. Le champ \`width\` est omis volontairement : la \`default_width\` de chaque widget s'applique automatiquement.
\`\`\`json
{"titre":"Dashboard des chantiers en difficulté - DEPT-42","containers":[{"widgets":[{"type":"widget_titre_section","titre":"Garantir 50% de produits bio, de qualité ou durables dans la restauration collective (Egalim)"}]},{"widgets":[{"type":"widget_tableau_indicateurs_chantier","chantier_id":"CH-064","territoire_code":"DEPT-42","jalon":2026}]},{"widgets":[{"type":"widget_cartographie_meteo","maille":"departementale","territoire_code":"DEPT-42","chantier_id":"CH-064","jalon":2026}]},{"widgets":[{"type":"widget_cartographie_taux_avancement","maille":"departementale","territoire_code":"DEPT-42","jalon":2026,"chantier_ids":["CH-064"]},{"type":"widget_cartographie_propositions_valeur_avancement","maille":"departementale","territoire_code":"DEPT-42","chantier_id":"CH-064","jalon":2026}]}]}
\`\`\``,
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
