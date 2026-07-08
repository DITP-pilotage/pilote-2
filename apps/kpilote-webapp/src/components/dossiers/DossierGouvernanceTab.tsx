import { type DossierContactsUtilesGroup } from '@pilote/kpilote-shared/dossierContactUtile'
import { type ResponsableApiModel } from '@pilote/kpilote-shared/responsable'

import { DossierContactsUtiles } from '@/components/dossiers/DossierContactsUtiles'
import { ResponsablesList } from '@/components/ui/ResponsablesList'
import { Heading } from '@pilote/kpilote-ui/Typography'

export function DossierGouvernanceTab({
  responsables,
  contactsUtiles,
}: {
  responsables: ReadonlyArray<ResponsableApiModel>
  contactsUtiles: ReadonlyArray<DossierContactsUtilesGroup>
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Heading size="sm">Responsables</Heading>
        <ResponsablesList responsables={responsables} />
      </div>

      <DossierContactsUtiles contactsUtiles={contactsUtiles} />
    </div>
  )
}
