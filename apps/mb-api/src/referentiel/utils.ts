import { type ReferentielApiModel } from '@pilote/mb-shared/referentiel'

import { type ReferentielModel, type WidgetModel } from '@/generated/prisma/models'
import { toWidgetApiModel } from '@/widget/utils'

export type ReferentielWithCount = ReferentielModel & {
  _count: { individus: number }
  widgets: ReadonlyArray<{ widget: WidgetModel }>
}

export const toReferentielApiModel = (referentiel: ReferentielWithCount): ReferentielApiModel => ({
  id: referentiel.publicId,
  nom: referentiel.nom,
  description: referentiel.description,
  nombreIndividus: referentiel._count.individus,
  widgets: referentiel.widgets.map(({ widget }) => toWidgetApiModel(widget)),
  createdAt: referentiel.createdAt.toISOString(),
  updatedAt: referentiel.updatedAt.toISOString(),
})
