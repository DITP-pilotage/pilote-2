import { type RelationApiModel } from '@pilote/kpilote-shared/relation'
import { ResultAsync } from 'neverthrow'

import { db } from '@/framework/persistence/dbStore'
import { relationInclude, toRelationApiModel } from '@/relation/utils'

export const getRelationByEnfant = (enfantPublicId: string): ResultAsync<RelationApiModel, never> =>
  ResultAsync.fromSafePromise(
    db().relation.findFirstOrThrow({
      where: { child: { publicId: enfantPublicId } },
      include: relationInclude,
    }),
  ).map(toRelationApiModel)
