import { z } from 'zod'

import { permissionActionSchema } from './permission'

const permissionEntrySchema = z.object({
  id: z
    .string()
    .describe(
      'Identifiant public de la ressource (`COL-…` pour un collection, `IND-…` pour un indicateur).',
    ),
  actions: z
    .array(permissionActionSchema)
    .min(1)
    .describe(
      'Actions accordées au principal courant sur cette ressource. Trié `READ` avant `WRITE`.',
    ),
})

export const mePermissionsApiModelSchema = z.object({
  isAdmin: z
    .literal(true)
    .optional()
    .describe(
      'Présent uniquement pour les principals admin (API key de rôle ADMIN). Quand présent, le ' +
        'client doit considérer toute action autorisée et ignorer `collections`/`indicateurs` ' +
        '(retournés vides). Pour les principals standards, ce champ est absent.',
    ),
  collections: z
    .array(permissionEntrySchema)
    .describe(
      "Permissions explicites du principal sur les collections, triées par `id` ASC. N'inclut PAS " +
        'le READ implicite des collections `PUBLIC` (le client le sait en affichant le collection).',
    ),
  indicateurs: z
    .array(permissionEntrySchema)
    .describe(
      'Permissions du principal sur les indicateurs, triées par `id` ASC. Inclut les permissions ' +
        'directes et le READ propagé depuis un collection où le principal a READ ou WRITE. Le WRITE ' +
        "indicateur reste strictement direct (jamais propagé). N'inclut PAS le READ implicite des " +
        'indicateurs `PUBLIC`.',
    ),
})

export type MePermissionsApiModel = z.infer<typeof mePermissionsApiModelSchema>

// Entrée de permission (id + actions), partagée par `collections` et `indicateurs`.
export type PermissionEntryApiModel = z.infer<typeof permissionEntrySchema>
