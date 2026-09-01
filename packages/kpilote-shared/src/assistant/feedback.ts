import { z } from 'zod'

export const CATEGORIES_PROBLEME = [
  'PROBLEME_TECHNIQUE',
  'INCOMPREHENSION',
  'SUGGESTION',
  'AUTRE',
] as const

export type CategorieProbleme = (typeof CATEGORIES_PROBLEME)[number]

export const LIBELLES_CATEGORIES: Record<CategorieProbleme, { titre: string; aide: string }> = {
  PROBLEME_TECHNIQUE: { titre: 'Problème technique', aide: 'Erreur ou bug' },
  INCOMPREHENSION: { titre: 'Incompréhension', aide: 'Réponse pas claire' },
  SUGGESTION: { titre: 'Suggestion', aide: "Idée d'amélioration" },
  AUTRE: { titre: 'Autre', aide: 'Autre problème' },
}

export const evaluerBodySchema = z
  .discriminatedUnion('evaluation', [
    z.object({ evaluation: z.literal('POSITIVE'), commentaire: z.string().optional() }),
    z.object({
      evaluation: z.literal('NEGATIVE'),
      categories: z.array(z.enum(CATEGORIES_PROBLEME)).min(1),
      commentaire: z.string().optional(),
    }),
  ])
  // « Autre » n'apprend rien sans texte : on l'exige plutôt que de collecter du bruit.
  .refine(
    (corps) =>
      corps.evaluation === 'POSITIVE' ||
      !corps.categories.includes('AUTRE') ||
      (corps.commentaire ?? '').trim().length > 0,
    { message: 'Un commentaire est requis quand la catégorie AUTRE est sélectionnée.' },
  )

export type EvaluerBody = z.infer<typeof evaluerBodySchema>
