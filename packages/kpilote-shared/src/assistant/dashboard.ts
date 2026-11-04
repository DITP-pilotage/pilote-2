import { z } from 'zod'

// Le dashboard que l'assistant compose : des références, jamais de valeurs. Chaque widget
// lit ses données au rendu, avec les droits de l'utilisateur.
//
// Les identifiants sont des chaînes simples : le sous-agent les recopie du contexte, et la
// validation côté serveur les compare à ce contexte.

const id = z.string().min(1).max(128)

const width = z
  .number()
  .int()
  .min(1)
  .max(4)
  .optional()
  .describe('Colonnes occupées sur 4 ; sans valeur, la largeur par défaut du widget.')

const widget = <T extends string, S extends z.ZodRawShape>(
  type: T,
  shape: S,
  description: string,
) =>
  z
    .object({ type: z.enum([type]), width, ...shape })
    .strict()
    .describe(description)

export const widgetSchema = z.discriminatedUnion('type', [
  widget(
    'kpi_indicateur',
    { indicateurId: id, individuId: id },
    "Dernière valeur, objectif et taux de progression d'un indicateur pour un individu.",
  ),
  widget(
    'kpi_collection',
    { collectionId: id, individuId: id },
    "Taux de progression pondéré d'une collection pour un individu.",
  ),
  widget(
    'evolution_indicateur',
    { indicateurId: id, individuIds: z.array(id).min(1).max(5) },
    "Courbe des valeurs d'un indicateur dans le temps, une série par individu (1 à 5).",
  ),
  widget(
    'tableau_individus',
    { indicateurId: id, individuIds: z.array(id).min(2).max(20) },
    'Tableau comparant un indicateur entre individus : valeur, objectif, taux, écart à la médiane.',
  ),
  widget(
    'contributions_collection',
    { collectionId: id, individuId: id },
    "Les indicateurs d'une collection pour un individu, avec leur pondération et leur taux.",
  ),
  widget(
    'valeurs_remarquables',
    { indicateurId: id, referentielId: id },
    "Minimum, médiane et maximum d'un indicateur sur un référentiel.",
  ),
  widget(
    'carte_indicateur',
    { indicateurId: id, referentielId: id },
    "Carte de France d'un indicateur, pour un référentiel qui a une carte.",
  ),
  widget(
    'titre_section',
    { titre: z.string().min(1).max(120), description: z.string().max(500).optional() },
    'Titre de section, sans aucun chiffre.',
  ),
  widget(
    'paragraph',
    {
      contenu: z.array(z.string().min(1).max(500)).min(1).max(10),
      variant: z.enum(['default', 'warning']).optional(),
    },
    'Texte court, une ligne par élément, sans aucun chiffre.',
  ),
])

export type DashboardWidget = z.output<typeof widgetSchema>

export type WidgetType = DashboardWidget['type']

export const WIDGET_TYPES = widgetSchema.options.map(
  (option) => option.shape.type.options[0],
) as ReadonlyArray<WidgetType>

export const WIDGET_WIDTHS: Record<WidgetType, { default: number; allowed: readonly number[] }> = {
  kpi_indicateur: { default: 1, allowed: [1, 2] },
  kpi_collection: { default: 1, allowed: [1, 2] },
  evolution_indicateur: { default: 4, allowed: [2, 4] },
  tableau_individus: { default: 4, allowed: [4] },
  contributions_collection: { default: 4, allowed: [2, 4] },
  valeurs_remarquables: { default: 2, allowed: [2, 4] },
  carte_indicateur: { default: 2, allowed: [2, 4] },
  titre_section: { default: 4, allowed: [4] },
  paragraph: { default: 4, allowed: [2, 4] },
}

/** La largeur demandée si elle est permise pour ce type, sinon sa largeur par défaut. */
export const widgetWidth = (widget: DashboardWidget): number => {
  const widths = WIDGET_WIDTHS[widget.type]
  return widget.width !== undefined && widths.allowed.includes(widget.width)
    ? widget.width
    : widths.default
}

export const dashboardSchema = z.object({
  titre: z.string().min(1).max(120),
  containers: z
    .array(z.object({ widgets: z.array(widgetSchema).min(1).max(8) }).strict())
    .min(1)
    .max(10)
    .describe(
      'Les blocs du dashboard, empilés ; chacun place ses widgets sur une grille de 4 colonnes.',
    ),
})

export type Dashboard = z.output<typeof dashboardSchema>
