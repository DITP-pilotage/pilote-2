import { z } from 'zod'

import { widgetPublicIdSchema } from './publicIds'

export { widgetPublicIdSchema } from './publicIds'

export const widgetApiModelSchema = z.object({
  id: widgetPublicIdSchema,
  type: z
    .string()
    .describe(
      "Type du widget : drive le composant de rendu côté frontend (ex. 'carte-france-departements').",
    ),
  nom: z.string().describe('Nom lisible du widget.'),
  joinKey: z
    .string()
    .describe(
      "Nom de la propriété à lire dans `Individu.metadata` pour mapper une valeur à une entité visuelle du widget (ex. 'codeInsee' pour mapper un département à son polygone).",
    ),
})
export type WidgetApiModel = z.infer<typeof widgetApiModelSchema>
