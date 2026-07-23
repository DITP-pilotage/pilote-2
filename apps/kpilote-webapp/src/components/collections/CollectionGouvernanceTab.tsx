import { type CollectionContactsUtilesGroup } from '@pilote/kpilote-shared/collectionContactUtile'
import { type ResponsableApiModel } from '@pilote/kpilote-shared/responsable'

import { CollectionContactsUtiles } from '@/components/collections/CollectionContactsUtiles'
import { ResponsablesList } from '@/components/ui/ResponsablesList'
import { Heading } from '@pilote/kpilote-ui/Typography'

export function CollectionGouvernanceTab({
  responsables,
  contactsUtiles,
}: {
  responsables: ReadonlyArray<ResponsableApiModel>
  contactsUtiles: ReadonlyArray<CollectionContactsUtilesGroup>
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Heading size="sm">Responsables</Heading>
        <ResponsablesList responsables={responsables} />
      </div>

      <CollectionContactsUtiles contactsUtiles={contactsUtiles} />
    </div>
  )
}
