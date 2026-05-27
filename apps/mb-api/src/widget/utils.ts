import { type WidgetApiModel } from '@pilote/mb-shared/widget'

import { type WidgetModel } from '@/generated/prisma/models'

export const toWidgetApiModel = (widget: WidgetModel): WidgetApiModel => ({
  id: widget.publicId,
  type: widget.type,
  nom: widget.nom,
  joinKey: widget.joinKey,
})
