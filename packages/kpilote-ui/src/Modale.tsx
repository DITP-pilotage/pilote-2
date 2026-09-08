import { X } from 'lucide-react'
import type { ReactNode } from 'react'

import { clsxm } from './clsxm'
import { Dialog } from './Dialog'

/**
 * Échelle de tailles, alignée sur celle de `Button` et `IconButton`.
 *
 * `md` est le défaut et laisse `Dialog.Content` décider : un formulaire ou une
 * confirmation n'ont rien à y gagner. `lg` et `xl` servent aux contenus qui se lisent en
 * pleine largeur — une conversation, un tableau — et fixent une hauteur pour que leur
 * contenu puisse s'étirer. Cette hauteur est bornée en `dvh` autant qu'en `vh` : sur
 * mobile, `vh` ignore la barre d'adresse et déborderait sous l'écran.
 */
const SIZES = {
  sm: 'w-[min(28rem,calc(100vw-2rem))]',
  md: '',
  lg: 'w-[min(64rem,calc(100vw-2rem))] h-[min(84vh,calc(100dvh-16vh))] max-h-none',
  xl: 'w-[min(80rem,calc(100vw-2rem))] h-[min(88vh,calc(100dvh-12vh))] max-h-none',
} as const

export type ModaleSize = keyof typeof SIZES

export function Modale({
  open,
  onClose,
  titre,
  description,
  children,
  footer,
  size = 'md',
  onEscape,
}: {
  open: boolean
  onClose: () => void
  /**
   * Quand la modale est une étape d'un parcours, `Échap` revient en arrière au lieu de
   * tout fermer — la croix, elle, ferme toujours.
   */
  onEscape?: () => void
  titre: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: ModaleSize
}): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={(ouvert: boolean) => (ouvert ? undefined : onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content
          className={clsxm(SIZES[size])}
          {...(onEscape
            ? {
                onEscapeKeyDown: (event: KeyboardEvent) => {
                  event.preventDefault()
                  onEscape()
                },
              }
            : {})}
        >
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
