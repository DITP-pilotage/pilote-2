import { type PanierContactsUtilesGroup } from '@pilote/kpilote-shared/panierContactUtile'
import { type ResponsableApiModel } from '@pilote/kpilote-shared/responsable'

import { PanierContactsUtiles } from '@/components/paniers/PanierContactsUtiles'
import { ResponsablesList } from '@/components/ui/ResponsablesList'
import { Heading } from '@/components/ui/Typography'

export function PanierGouvernanceTab({
  responsables,
  contactsUtiles,
}: {
  responsables: ReadonlyArray<ResponsableApiModel>
  contactsUtiles: ReadonlyArray<PanierContactsUtilesGroup>
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Heading size="sm">Responsables</Heading>
        <ResponsablesList responsables={responsables} />
      </div>

      <PanierContactsUtiles contactsUtiles={contactsUtiles} />
    </div>
  )
}
