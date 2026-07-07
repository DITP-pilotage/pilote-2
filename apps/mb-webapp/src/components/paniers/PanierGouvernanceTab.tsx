import { type ResponsableApiModel } from '@pilote/mb-shared/responsable'

import { PanierContactsUtiles } from '@/components/paniers/PanierContactsUtiles'
import { ResponsablesList } from '@/components/ui/ResponsablesList'
import { Heading } from '@/components/ui/Typography'

export function PanierGouvernanceTab({
  panierId,
  responsables,
}: {
  panierId: string
  responsables: ResponsableApiModel[]
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Heading size="sm">Responsables</Heading>
        <ResponsablesList responsables={responsables} />
      </div>

      <PanierContactsUtiles panierId={panierId} />
    </div>
  )
}
