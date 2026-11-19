import { type AxeApiModel } from '@pilote/kpilote-shared/axe'
import { type DeclarationAxeIndicateur } from '@pilote/kpilote-shared/indicateur'
import { Suspense } from 'react'

import { AxesCroises } from '@/components/axes-croises/AxesCroises'
import { Dialog } from '@pilote/kpilote-ui/Dialog'

export function AxesCroisesModale({
  open,
  onClose,
  declarations,
  axes,
}: {
  open: boolean
  onClose: () => void
  declarations: ReadonlyArray<DeclarationAxeIndicateur>
  axes: ReadonlyArray<AxeApiModel>
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className="top-4 h-[calc(100dvh-2rem)] max-h-none w-[calc(100vw-2rem)]">
          <Suspense
            fallback={<p className="p-6 text-sm text-text-muted">Chargement des modalités…</p>}
          >
            <AxesCroises declarations={declarations} axes={axes} onClose={onClose} />
          </Suspense>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
