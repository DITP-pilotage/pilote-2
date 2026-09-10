import { slugSchema } from './slug'

// Toutes les entités partagent le même format d'identifiant public : un slug.
// Les schémas restent nommés par entité pour que les paramètres de route
// gardent un type et une documentation propres, mais ils ne se distinguent plus
// par leur validation — une inversion d'argument se solde par un 404, plus par
// une erreur 400.
export const indicateurPublicIdSchema = slugSchema.describe(
  "Identifiant public de l'indicateur, sous forme de slug (ex. `bilan-de-prevention`, `IND-42`).",
)

export const collectionPublicIdSchema = slugSchema.describe(
  'Identifiant public de la collection, sous forme de slug (ex. `sante-de-proximite`, `COL-001`).',
)

export const referentielPublicIdSchema = slugSchema.describe(
  'Identifiant public du référentiel, sous forme de slug (ex. `REF-DEPT`).',
)

export const individuPublicIdSchema = slugSchema.describe(
  "Identifiant public d'individu, sous forme de slug (ex. `DEPT-84`, `REG-93`, `FR`).",
)

export const widgetPublicIdSchema = slugSchema.describe(
  'Identifiant public du widget, sous forme de slug (ex. `WID-CARTE-DEPT`).',
)
