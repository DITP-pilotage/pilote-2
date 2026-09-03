import { z } from 'zod'

export const ISSUE_CATEGORIES = [
  'PROBLEME_TECHNIQUE',
  'INCOMPREHENSION',
  'SUGGESTION',
  'AUTRE',
] as const

export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]

export const CATEGORY_LABELS: Record<IssueCategory, { title: string; hint: string }> = {
  PROBLEME_TECHNIQUE: { title: 'Problème technique', hint: 'Erreur ou bug' },
  INCOMPREHENSION: { title: 'Incompréhension', hint: 'Réponse pas claire' },
  SUGGESTION: { title: 'Suggestion', hint: "Idée d'amélioration" },
  AUTRE: { title: 'Autre', hint: 'Autre problème' },
}

export const rateBodySchema = z
  .discriminatedUnion('evaluation', [
    z.object({ evaluation: z.literal('POSITIVE'), commentaire: z.string().optional() }),
    z.object({
      evaluation: z.literal('NEGATIVE'),
      categories: z.array(z.enum(ISSUE_CATEGORIES)).min(1),
      commentaire: z.string().optional(),
    }),
  ])
  // « Autre » n'apprend rien sans texte : on l'exige plutôt que de collecter du bruit.
  .refine(
    (body) =>
      body.evaluation === 'POSITIVE' ||
      !body.categories.includes('AUTRE') ||
      (body.commentaire ?? '').trim().length > 0,
    { message: 'Un commentaire est requis quand la catégorie AUTRE est sélectionnée.' },
  )

export type RateBody = z.infer<typeof rateBodySchema>
