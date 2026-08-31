import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { clsxm } from './clsxm'
import { Dialog } from './Dialog'

/**
 * `large` sert aux contenus qui se lisent en pleine largeur — une conversation, un tableau.
 * `standard` reste le défaut : un formulaire ou une confirmation n'y gagnent rien.
 */
const LARGEURS = {
  standard: '',
  large: 'w-[min(64rem,calc(100vw-2rem))] max-h-[88vh]',
} as const

export type TailleModale = keyof typeof LARGEURS

export function Modale({
  open,
  onClose,
  titre,
  description,
  children,
  footer,
  taille = 'standard',
}: {
  open: boolean
  onClose: () => void
  titre: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  taille?: TailleModale
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(ouvert: boolean) => (ouvert ? undefined : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content className={clsxm(LARGEURS[taille])}>
          <div className="flex items-start justify-between border-b border-border px-6 py-4">
            <div>
              <Dialog.Title>{titre}</Dialog.Title>
              {description !== undefined ? (
                <Dialog.Description>{description}</Dialog.Description>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Fermer"
              onClick={onClose}
              className="rounded-md p-1.5 text-text-subtle hover:bg-background hover:text-text"
            >
              <X className="size-[18px]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer !== undefined ? (
            <div className="flex items-center justify-end gap-2 border-t border-border bg-background/60 px-6 py-4">
              {footer}
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
