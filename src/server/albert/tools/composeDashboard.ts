import { tool } from "ai";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import { GetChantiersEnRetardQuery } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import type { ChantierEnRetard } from "@/server/chantiers/query/GetChantiersEnRetardQuery";
import { GetChantiersEnDifficulteQuery } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import type { ChantierEnDifficulte } from "@/server/chantiers/query/GetChantiersEnDifficulteQuery";
import { GetChantierIndicateursQuery } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type { GetChantierIndicateursResult } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getContainer } from "@/server/dependances";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { MailleNonAutoriséeErreur } from "@/server/utils/errors";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import {
  DEFAULT_WIDTHS,
  ROW_GROUPS,
  type RowGroup,
  type WidgetType,
} from "@/server/albert/tools/composeDashboardLayout";

export { DEFAULT_WIDTHS, ROW_GROUPS, type RowGroup, type WidgetType };

const kpiMetricSchema = z
  .enum(["ta_global", "mediane", "nb_chantiers_en_retard"])
  .describe(
    "Métrique métier à afficher. ta_global = TA agrégé du territoire ; mediane = médiane de répartition ; nb_chantiers_en_retard = nombre de chantiers en retard.",
  );

const jalonSchema = z
  .number()
  .int()
  .min(2022)
  .max(new Date().getFullYear())
  .describe("Année du jalon (ex: 2024, 2025)");

const territoireCodeSchema = z
  .string()
  .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)");

const kpiCardWidgetInput = z.object({
  type: z.literal("kpi_card"),
  metric: kpiMetricSchema,
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z
    .union([z.literal(3), z.literal(4), z.literal(6)])
    .optional()
    .describe(
      "Largeur du widget en colonnes (default_width=3, allowed_widths=[3,4,6]). Petit, on peut en aligner 4 par rangée.",
    ),
});

const tableauIndicateursWidgetInput = z.object({
  type: z.literal("tableau_indicateurs"),
  chantier_id: z.string().describe("Identifiant du chantier (ex: CH-001)"),
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z
    .literal(12)
    .optional()
    .describe(
      "Largeur du widget (default_width=12, allowed_widths=[12]). Beaucoup de colonnes, demande la pleine largeur.",
    ),
});

const listeChantiersAlerteWidgetInput = z.object({
  type: z.literal("liste_chantiers_alerte"),
  territoire_code: territoireCodeSchema,
  type_alerte: z
    .enum(["retard", "difficulte"])
    .describe(
      "retard = critère quantitatif (écart <= -10 pts) ; difficulte = critère qualitatif (météo ORAGE/NUAGE).",
    ),
  jalon: jalonSchema,
  width: z
    .union([z.literal(6), z.literal(12)])
    .optional()
    .describe(
      "Largeur du widget (default_width=6, allowed_widths=[6,12]). Liste verticale, demi ou pleine largeur.",
    ),
});

const texteSectionWidgetInput = z.object({
  type: z.literal("texte_section"),
  titre: z
    .string()
    .min(1)
    .max(120)
    .describe(
      "Titre de la section. Court et descriptif. Ne doit PAS contenir de valeur chiffrée (ni pourcentage ni écart en points).",
    ),
  description: z
    .string()
    .max(500)
    .optional()
    .describe(
      "Description facultative de la section. Maximum 2-3 phrases. Ne doit PAS contenir de valeur chiffrée (ni pourcentage ni écart en points) — si tu veux montrer un chiffre, utilise un kpi_card à la place.",
    ),
  width: z
    .union([z.literal(6), z.literal(12)])
    .optional()
    .describe(
      "Largeur du widget (default_width=12, allowed_widths=[6,12]). Pleine largeur par défaut pour servir de titre de section.",
    ),
});

const fillerWidgetInput = z.object({
  type: z.literal("filler"),
  width: z
    .union([
      z.literal(3),
      z.literal(4),
      z.literal(6),
      z.literal(8),
      z.literal(12),
    ])
    .describe(
      "Largeur du filler en colonnes (required, allowed_widths=[3,4,6,8,12]). Utilise ce widget pour combler l'espace restant sur une rangée et forcer le widget suivant à commencer sur une nouvelle rangée. Aucun contenu n'est affiché.",
    ),
});

const widgetInputSchema = z
  .discriminatedUnion("type", [
    kpiCardWidgetInput,
    tableauIndicateursWidgetInput,
    listeChantiersAlerteWidgetInput,
    texteSectionWidgetInput,
    fillerWidgetInput,
  ])
  .describe(
    "Widget du dashboard. Le type discrimine la forme attendue. Les widgets de données (kpi_card, tableau_indicateurs, liste_chantiers_alerte) ne contiennent que des références (territoire, chantier, jalon) — JAMAIS de valeurs chiffrées : elles sont résolues côté serveur. Les widgets de présentation (texte_section, filler) structurent visuellement le dashboard sans fetch de données.",
  );

const containerInputSchema = z
  .object({
    widgets: z
      .array(widgetInputSchema)
      .min(1)
      .max(12)
      .describe(
        "Widgets du container, placés sur un grid interne 12 colonnes. Tous les widgets non-spacer d'un container doivent partager le même row_group (voir la description du tool).",
      ),
  })
  .superRefine((container, ctx) => {
    const nonSpacers = container.widgets.filter(
      (widget) => ROW_GROUPS[widget.type] !== "spacer",
    );

    if (nonSpacers.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Container vide : un container doit contenir au moins 1 widget non-spacer. Un container composé uniquement de filler n'a pas de sens.",
        path: ["widgets"],
      });
      return;
    }

    const groups = new Set(nonSpacers.map((widget) => ROW_GROUPS[widget.type]));
    if (groups.size > 1) {
      const groupsList = Array.from(groups).join(", ");
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Container incohérent : les widgets mélangent les row_groups [${groupsList}]. Chaque container ne peut contenir qu'un seul row_group (hors filler). Sépare ces widgets dans des containers distincts que tu pourras placer côte à côte via leurs largeurs externes.`,
        path: ["widgets"],
      });
    }
  });

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
      "Liste ordonnée des containers. Les containers se placent sur le grand grid 12 colonnes en packing left-to-right top-to-bottom selon leur largeur externe. Chaque container contient ses propres widgets dans un grid interne 12 colonnes.",
    ),
});

export type ComposeDashboardInput = z.infer<typeof composeDashboardInputSchema>;

export type KpiCardData = {
  label: string;
  value: string;
};

export type TableauIndicateursData = {
  indicateurs: GetChantierIndicateursResult["indicateurs"];
};

export type ListeChantiersAlerteData =
  | {
      type_alerte: "retard";
      chantiers: Array<{
        id: string;
        nom: string;
        ecart: number;
        meteo: string | null;
      }>;
    }
  | {
      type_alerte: "difficulte";
      chantiers: Array<{
        id: string;
        nom: string;
        meteo: ChantierEnDifficulte["meteo"];
        ecart: number | null;
      }>;
    };

export type KpiCardWidgetDefinition = z.infer<typeof kpiCardWidgetInput>;
export type TableauIndicateursWidgetDefinition = z.infer<
  typeof tableauIndicateursWidgetInput
>;
export type ListeChantiersAlerteWidgetDefinition = z.infer<
  typeof listeChantiersAlerteWidgetInput
>;
export type TexteSectionWidgetDefinition = z.infer<
  typeof texteSectionWidgetInput
>;
export type FillerWidgetDefinition = z.infer<typeof fillerWidgetInput>;

export type ResolvedWidget =
  | {
      kind: "kpi_card";
      definition: KpiCardWidgetDefinition;
      data: KpiCardData;
    }
  | {
      kind: "tableau_indicateurs";
      definition: TableauIndicateursWidgetDefinition;
      data: TableauIndicateursData;
    }
  | {
      kind: "liste_chantiers_alerte";
      definition: ListeChantiersAlerteWidgetDefinition;
      data: ListeChantiersAlerteData;
    }
  | {
      kind: "texte_section";
      definition: TexteSectionWidgetDefinition;
    }
  | {
      kind: "filler";
      definition: FillerWidgetDefinition;
    }
  | {
      kind: "error";
      definition: ComposeDashboardInput["containers"][number]["widgets"][number];
      message: string;
    };

export type ResolvedContainer = {
  widgets: ResolvedWidget[];
};

export type ComposeDashboardOutput = {
  titre: string;
  containers: ResolvedContainer[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Le dashboard a été composé et sera affiché visuellement sous forme de widgets dans l'interface.
Ne reproduis JAMAIS les valeurs chiffrées des widgets dans ta réponse textuelle.
Tu peux ajouter une phrase courte d'introduction (« Voici le dashboard demandé. ») mais pas de commentaire sur les chiffres.
Si l'utilisateur demande à modifier le dashboard, rappelle compose_dashboard avec une nouvelle définition complète.`;

const KPI_LABELS: Record<z.infer<typeof kpiMetricSchema>, string> = {
  ta_global: "Taux d'avancement",
  mediane: "Médiane de répartition",
  nb_chantiers_en_retard: "Chantiers en retard",
};

function determineMaille(territoireCode: string): Maille {
  if (territoireCode.startsWith("NAT")) return "nationale";
  if (territoireCode.startsWith("REG")) return "regionale";
  return "departementale";
}

function formatPourcentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${value.toFixed(0)}%`;
}

const FORBIDDEN_NUMBER_PATTERN = /\d+\s*(%|points?|pts)\b/i;

function findForbiddenNumber(text: string | undefined): string | null {
  if (!text) return null;
  const match = FORBIDDEN_NUMBER_PATTERN.exec(text);
  return match ? match[0] : null;
}

export function createComposeDashboardTool({
  prisma,
  getChantiersEnRetardQuery,
  getChantiersEnDifficulteQuery,
  getChantierIndicateursQuery,
}: {
  prisma: PrismaPilote;
  getChantiersEnRetardQuery: GetChantiersEnRetardQuery;
  getChantiersEnDifficulteQuery: GetChantiersEnDifficulteQuery;
  getChantierIndicateursQuery: GetChantierIndicateursQuery;
}) {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    const territoiresAccessibles = habilitations.lecture.territoires;

    return tool({
      description: `Compose un tableau de bord dynamique à partir d'une liste de containers. L'outil ne fait que valider la structure et résoudre côté serveur les valeurs métier — tu n'embarques JAMAIS de chiffres dans tes paramètres, uniquement des références (territoire_code, chantier_id, jalon, métrique).

Utilise cet outil quand l'utilisateur demande explicitement de **construire**, **composer**, **assembler** ou **afficher** un tableau de bord, un cockpit, une vue personnalisée. Avant tout appel, suis le Pattern (g) du system prompt : identifier les paramètres manquants, poser les questions nécessaires, reformuler le plan, puis composer.

## Concept de container

Un dashboard est une liste ordonnée de containers **empilés verticalement**, chacun occupant la pleine largeur du dashboard (grid 12 colonnes). Chaque container contient ses propres widgets placés sur son grid interne 12 colonnes. L'ordre des containers dans la liste détermine l'ordre vertical d'affichage.

Le container est un regroupement sémantique : tous ses widgets partagent un même row_group pour garantir une mise en page visuellement cohérente.

## Catalogue de widgets et row_groups

| Widget | row_group | default_width | allowed_widths | Paramètres |
|---|---|---|---|---|
| kpi_card | kpi | 3 | [3,4,6] | metric ∈ {ta_global, mediane, nb_chantiers_en_retard}, territoire_code, jalon |
| tableau_indicateurs | wide | 12 | [12] | chantier_id, territoire_code, jalon |
| liste_chantiers_alerte | list | 6 | [6,12] | territoire_code, type_alerte ∈ {retard, difficulte}, jalon |
| texte_section | section | 12 | [6,12] | titre (requis), description (optionnelle) — AUCUN chiffre (% ou points) |
| filler | spacer | — | [3,4,6,8,12] | width requis — widget vide pour combler un container |

**Règle d'or (validée côté serveur)** : tous les widgets non-spacer d'un même container doivent partager le même row_group. Si tu veux placer des types différents côte à côte, mets-les dans des containers séparés.

## Structure recommandée

Un dashboard typique est une succession de containers empilés, chacun avec un rôle clair :
- un container pour un \`texte_section\` (titre de section),
- un container pour un groupe de \`kpi_card\` — regroupe-les TOUS dans un SEUL container (la grille interne gère naturellement 3 ou 4 kpi par rangée), ne crée jamais un container par kpi,
- un container pour les \`liste_chantiers_alerte\` — si tu en as plusieurs (ex: chantiers en retard ET chantiers en difficulté), mets-les dans le MÊME container avec \`width: 6\` chacune pour un affichage côte à côte. Un container avec une seule liste laisse beaucoup d'espace vide à droite, donc évite-le.
- un container pour un \`tableau_indicateurs\`.

Règle générale : un widget solo dans un container de 12 colonnes gâche de la place si sa \`default_width\` est inférieure à 12. Regroupe toujours les widgets compatibles (même \`row_group\`) dans un seul container pour remplir naturellement la largeur.

## Règles JSON strictes

Tu produis du JSON STRICT conforme au schéma. INTERDIT :
- Aucun commentaire (ni \`//\` ni \`/* */\`).
- Aucune virgule traînante.
- Aucune clé non quotée.
- Aucun texte explicatif en dehors de l'objet JSON racine.

Ne copie JAMAIS des fragments "pseudo-code" ou des commentaires explicatifs dans ta réponse : produis uniquement l'objet JSON valide attendu par le schéma.`,
      inputSchema: composeDashboardInputSchema,
      execute: async (input): Promise<ComposeDashboardOutput> => {
        const containers: ResolvedContainer[] = [];

        for (const container of input.containers) {
          const resolvedWidgets: ResolvedWidget[] = [];

          for (const widget of container.widgets) {
            if (widget.type === "filler") {
              resolvedWidgets.push({ kind: "filler", definition: widget });
              continue;
            }

            if (widget.type === "texte_section") {
              const forbiddenInTitre = findForbiddenNumber(widget.titre);
              const forbiddenInDescription = findForbiddenNumber(
                widget.description,
              );
              const forbidden = forbiddenInTitre ?? forbiddenInDescription;
              if (forbidden !== null) {
                resolvedWidgets.push({
                  kind: "error",
                  definition: widget,
                  message: `Le widget texte_section ne doit pas contenir de valeur chiffrée ("${forbidden}"). Utilise un kpi_card pour afficher un chiffre.`,
                });
                continue;
              }
              resolvedWidgets.push({
                kind: "texte_section",
                definition: widget,
              });
              continue;
            }

            if (!territoiresAccessibles.includes(widget.territoire_code)) {
              resolvedWidgets.push({
                kind: "error",
                definition: widget,
                message: `Accès non autorisé au territoire ${widget.territoire_code}`,
              });
              continue;
            }

            try {
              if (widget.type === "kpi_card") {
                const data = await resolveKpiCard({
                  widget,
                  prisma,
                  getChantiersEnRetardQuery,
                  habilitations,
                });
                resolvedWidgets.push({
                  kind: "kpi_card",
                  definition: widget,
                  data,
                });
                continue;
              }

              if (widget.type === "tableau_indicateurs") {
                const result = await getChantierIndicateursQuery.execute({
                  territoireCode: widget.territoire_code,
                  chantierId: widget.chantier_id,
                  jalon: widget.jalon,
                });
                resolvedWidgets.push({
                  kind: "tableau_indicateurs",
                  definition: widget,
                  data: { indicateurs: result.indicateurs },
                });
                continue;
              }

              if (widget.type === "liste_chantiers_alerte") {
                const data = await resolveListeChantiersAlerte({
                  widget,
                  getChantiersEnRetardQuery,
                  getChantiersEnDifficulteQuery,
                });
                resolvedWidgets.push({
                  kind: "liste_chantiers_alerte",
                  definition: widget,
                  data,
                });
                continue;
              }
            } catch (error) {
              resolvedWidgets.push({
                kind: "error",
                definition: widget,
                message:
                  error instanceof Error
                    ? error.message
                    : "Erreur de résolution du widget",
              });
            }
          }

          containers.push({ widgets: resolvedWidgets });
        }

        return {
          titre: input.titre,
          containers,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}

async function resolveKpiCard({
  widget,
  prisma,
  getChantiersEnRetardQuery,
  habilitations,
}: {
  widget: z.infer<typeof kpiCardWidgetInput>;
  prisma: PrismaPilote;
  getChantiersEnRetardQuery: GetChantiersEnRetardQuery;
  habilitations: Habilitations;
}): Promise<KpiCardData> {
  const label = KPI_LABELS[widget.metric];

  if (widget.metric === "nb_chantiers_en_retard") {
    const result = await getChantiersEnRetardQuery.execute({
      territoireCode: widget.territoire_code,
      jalon: widget.jalon,
    });
    return {
      label,
      value: String(result.chantiers_en_retard.length),
    };
  }

  const db = prisma.getInstance();
  const publishedChantiers = await db.chantier_identite.findMany({
    where: { statut: $Enums.type_statut.PUBLIE },
    select: { id: true },
  });
  const chantierIds = publishedChantiers.map((chantier) => chantier.id);

  if (widget.metric === "ta_global") {
    const legacyContainer = getContainer("legacy");
    const agregerAvancementsChantiersUseCase = legacyContainer.resolve(
      "agregerAvancementsChantiersUseCase",
    );
    const { agregat } = await agregerAvancementsChantiersUseCase.run(
      chantierIds,
      widget.jalon,
    );
    const maille = determineMaille(widget.territoire_code);
    const territoireData = agregat[maille]?.territoires[widget.territoire_code];
    const taux = territoireData?.repartition.avancements.annuel.moyenne ?? null;
    return { label, value: formatPourcentage(taux) };
  }

  // metric === "mediane"
  const récupérerStatistiquesUseCase = getContainer("chantiers").resolve(
    "récupérerStatistiquesAvancementChantiersUseCase",
  );
  const maille = determineMaille(widget.territoire_code);
  const repartitionMaille: Maille =
    maille === "nationale" ? "departementale" : maille;
  try {
    const stats = await récupérerStatistiquesUseCase.run(
      chantierIds,
      repartitionMaille,
      habilitations,
      widget.jalon,
    );
    return { label, value: formatPourcentage(stats?.médiane ?? null) };
  } catch (error) {
    if (error instanceof MailleNonAutoriséeErreur) {
      return { label, value: "—" };
    }
    throw error;
  }
}

async function resolveListeChantiersAlerte({
  widget,
  getChantiersEnRetardQuery,
  getChantiersEnDifficulteQuery,
}: {
  widget: z.infer<typeof listeChantiersAlerteWidgetInput>;
  getChantiersEnRetardQuery: GetChantiersEnRetardQuery;
  getChantiersEnDifficulteQuery: GetChantiersEnDifficulteQuery;
}): Promise<ListeChantiersAlerteData> {
  if (widget.type_alerte === "retard") {
    const result = await getChantiersEnRetardQuery.execute({
      territoireCode: widget.territoire_code,
      jalon: widget.jalon,
    });
    return {
      type_alerte: "retard",
      chantiers: result.chantiers_en_retard.map(
        (chantierEnRetard: ChantierEnRetard) => ({
          id: chantierEnRetard.chantier.id,
          nom: chantierEnRetard.chantier.nom,
          ecart: chantierEnRetard.ecart,
          meteo: chantierEnRetard.synthese?.meteo ?? null,
        }),
      ),
    };
  }

  const result = await getChantiersEnDifficulteQuery.execute({
    territoireCode: widget.territoire_code,
    jalon: widget.jalon,
  });
  return {
    type_alerte: "difficulte",
    chantiers: result.chantiers_en_difficulte.map(
      (chantierEnDifficulte: ChantierEnDifficulte) => ({
        id: chantierEnDifficulte.chantier.id,
        nom: chantierEnDifficulte.chantier.nom,
        meteo: chantierEnDifficulte.meteo,
        ecart: chantierEnDifficulte.ecart,
      }),
    ),
  };
}
