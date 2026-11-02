import { type ReferentielApiModel } from '@pilote/kpilote-shared/referentiel'

import { type ReferentielModel, type WidgetModel } from '@/generated/prisma/models'
import { toWidgetApiModel } from '@/widget/utils'

export type ReferentielWithCount = ReferentielModel & {
  dimension: { publicId: string }
  _count: { individus: number }
  widgets: ReadonlyArray<{ widget: WidgetModel }>
}

export const toReferentielApiModel = (referentiel: ReferentielWithCount): ReferentielApiModel => ({
  id: referentiel.publicId,
  nom: referentiel.nom,
  description: referentiel.description,
  dimension: referentiel.dimension.publicId,
  nombreIndividus: referentiel._count.individus,
  widgets: referentiel.widgets.map(({ widget }) => toWidgetApiModel(widget)),
  createdAt: referentiel.createdAt.toISOString(),
  updatedAt: referentiel.updatedAt.toISOString(),
})
