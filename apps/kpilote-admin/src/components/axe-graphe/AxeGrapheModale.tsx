import { type AxeApiModel, type ModaliteApiModel } from '@pilote/kpilote-shared/axe'

import { AxeGraphe } from '@/components/axe-graphe/AxeGraphe'
import { Dialog } from '@pilote/kpilote-ui/Dialog'

export function AxeGrapheModale({
  open,
  onClose,
  axe,
  modalites,
  locked,
}: {
  open: boolean
  onClose: () => void
  axe: AxeApiModel
  modalites: ReadonlyArray<ModaliteApiModel>
  locked: boolean
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
          <AxeGraphe axe={axe} modalites={modalites} locked={locked} onClose={onClose} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
