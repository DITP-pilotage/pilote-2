import { ponderationSchema } from '@pilote/kpilote-shared/collection'
import { z } from 'zod'

// Un `<input type="number">` produit une chaîne : on la convertit ici, puis on
// délègue les règles métier (positif, deux décimales) au schéma partagé.
export const ponderationFormSchema = z.object({
  ponderation: z
    .string()
    .trim()
    .min(1, 'La pondération est requise')
    .refine((saisie) => Number.isFinite(Number(saisie)), 'Valeur numérique attendue')
    .transform(Number)
    .pipe(ponderationSchema),
})

export type PonderationFormInput = z.input<typeof ponderationFormSchema>
export type PonderationFormValues = z.output<typeof ponderationFormSchema>
