import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'
import { deriveTitle } from '@pilote/kpilote-shared/assistant/conversation'
import { clsxm } from '@pilote/kpilote-ui/clsxm'
import { Sparkles } from 'lucide-react'
import { Dialog } from 'radix-ui'
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react'

import { analytics } from '@/analytics/tracker'

import { useConversationState } from '../useAssistant'
import { AssistantContent } from './AssistantContent'
import { useAssistantDisplay } from './AssistantProvider'
import {
  readPanelWidth,
  readWindowSize,
  writePanelWidth,
  writeWindowSize,
} from './preferencesStorage'
import { useResizable } from './useResizable'
import {
  boundPanelWidth,
  boundWindowSize,
  PANEL_WIDTH,
  WINDOW_MARGIN,
  WINDOW_SIZE,
  type WindowSize,
} from './views'

const NAME = 'Assistant kpilote'
const KEYBOARD_STEP_PX = 20

// Au-dessus de l'en-tête (z-30), sous les modales, menus et toasts (z-40 et plus) : ceux
// qu'on ouvre depuis l'assistant restent devant lui.
const LAYER = 'z-[35]'

const boundPanel = (width: number) => boundPanelWidth(width, window.innerWidth)
const readPanel = () => readPanelWidth() ?? PANEL_WIDTH.default

/** Dans le flux de la page, à sa droite : la page rétrécit et le panneau reste en navigation. */
export function AssistantSidePanel() {
  const { conversationId, display, allowed } = useAssistantDisplay()
  if (!allowed || !conversationId || display !== 'sidePanel') return null
  return <SidePanel conversationId={conversationId} />
}

function SidePanel({ conversationId }: { conversationId: string }) {
  const { size, latestSize, draggedHandle, resize, resizeAndPersist, startDrag, endDrag } =
    useResizable<number, 'left'>({ read: readPanel, bound: boundPanel, persist: writePanelWidth })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const direction = event.key === 'ArrowLeft' ? 1 : event.key === 'ArrowRight' ? -1 : 0
    if (direction === 0) return
    event.preventDefault()
    resizeAndPersist(latestSize.current + direction * KEYBOARD_STEP_PX)
  }

  return (
    <aside
      aria-label={NAME}
      className="sticky top-0 z-[2] flex h-screen shrink-0 flex-col border-l border-border bg-surface print:hidden"
      style={{ width: size }}
    >
      <div
        role="separator"
        tabIndex={0}
        aria-label="Largeur du panneau de l'assistant"
        aria-orientation="vertical"
        aria-valuemin={PANEL_WIDTH.min}
        aria-valuemax={boundPanel(PANEL_WIDTH.max)}
        aria-valuenow={size}
        title="Redimensionner le panneau"
        className="group absolute top-0 bottom-0 -left-1.5 z-10 flex w-3 cursor-col-resize touch-none items-center justify-center focus:outline-none"
        onKeyDown={onKeyDown}
        onPointerDown={startDrag('left')}
        onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
          if (draggedHandle) resize(window.innerWidth - event.clientX)
        }}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span
          className={clsxm(
            'h-12 w-1 rounded-full',
            draggedHandle
              ? 'bg-primary'
              : 'bg-primary-tinted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:bg-primary group-focus-visible:opacity-100',
          )}
        />
      </div>
      <AssistantContent conversationId={conversationId} />
    </aside>
  )
}

type WindowHandle = 'left' | 'top' | 'corner'

const boundWindow = (size: WindowSize) =>
  boundWindowSize(size, { width: window.innerWidth, height: window.innerHeight })
const readWindow = () =>
  readWindowSize() ?? { width: WINDOW_SIZE.width.default, height: WINDOW_SIZE.height.default }

/** Posée sur la page, en bas à droite : non modale, redimensionnable par sa gauche et son haut. */
function FloatingWindow({ conversationId }: { conversationId: string }) {
  const { size, latestSize, draggedHandle, resize, resizeAndPersist, startDrag, endDrag } =
    useResizable<WindowSize, WindowHandle>({
      read: readWindow,
      bound: boundWindow,
      persist: writeWindowSize,
    })
  const maxSize = boundWindow({ width: WINDOW_SIZE.width.max, height: Number.POSITIVE_INFINITY })

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggedHandle) return
    const width = window.innerWidth - WINDOW_MARGIN - event.clientX
    const height = window.innerHeight - WINDOW_MARGIN - event.clientY
    resize({
      ...latestSize.current,
      ...(draggedHandle !== 'top' ? { width } : {}),
      ...(draggedHandle !== 'left' ? { height } : {}),
    })
  }

  const onKeyDown = (dimension: keyof WindowSize) => (event: KeyboardEvent<HTMLDivElement>) => {
    const grow = dimension === 'width' ? 'ArrowLeft' : 'ArrowUp'
    const shrink = dimension === 'width' ? 'ArrowRight' : 'ArrowDown'
    const direction = event.key === grow ? 1 : event.key === shrink ? -1 : 0
    if (direction === 0) return
    event.preventDefault()
    resizeAndPersist({
      ...latestSize.current,
      [dimension]: latestSize.current[dimension] + direction * KEYBOARD_STEP_PX,
    })
  }

  const pointer = (handle: WindowHandle) => ({
    onPointerDown: startDrag(handle),
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  })

  return (
    <section
      aria-label={NAME}
      className={clsxm(
        'fixed right-4 bottom-4 flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_20px_60px_rgba(0,0,0,0.22)] print:hidden',
        LAYER,
      )}
      style={{ width: size.width, height: size.height }}
    >
      <div
        role="separator"
        tabIndex={0}
        aria-label="Largeur de la fenêtre de l'assistant"
        aria-orientation="vertical"
        aria-valuemin={WINDOW_SIZE.width.min}
        aria-valuemax={maxSize.width}
        aria-valuenow={size.width}
        title="Redimensionner la fenêtre"
        className="absolute top-3 bottom-0 -left-1 z-10 w-2 cursor-ew-resize touch-none focus-visible:bg-primary/30 focus-visible:outline-none"
        onKeyDown={onKeyDown('width')}
        {...pointer('left')}
      />
      <div
        role="separator"
        tabIndex={0}
        aria-label="Hauteur de la fenêtre de l'assistant"
        aria-orientation="horizontal"
        aria-valuemin={WINDOW_SIZE.height.min}
        aria-valuemax={maxSize.height}
        aria-valuenow={size.height}
        title="Redimensionner la fenêtre"
        className="absolute -top-1 right-0 left-3 z-10 h-2 cursor-ns-resize touch-none focus-visible:bg-primary/30 focus-visible:outline-none"
        onKeyDown={onKeyDown('height')}
        {...pointer('top')}
      />
      <div
        aria-hidden="true"
        className="absolute -top-1 -left-1 z-10 size-4 cursor-nwse-resize touch-none"
        {...pointer('corner')}
      />
      <AssistantContent conversationId={conversationId} />
    </section>
  )
}

/**
 * Plein écran ou centrée (au gabarit de la palette ⌘K), comme une modale : focus piégé, page figée ; Échap masque
 * l'assistant sans le fermer.
 */
function ModalView({ conversationId, centered }: { conversationId: string; centered: boolean }) {
  const { minimize } = useAssistantDisplay()
  const hide = () => {
    analytics.trackEvent(
      analyticsEvents.assistant.minimize({ view: centered ? 'centered' : 'fullscreen' }),
    )
    minimize()
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) hide()
      }}
    >
      <Dialog.Portal>
        {/* Sans overlay, Radix ne bloque ni le défilement ni les clics de la page. */}
        <Dialog.Overlay
          className={clsxm(
            'fixed inset-0',
            centered ? 'bg-black/40 backdrop-blur-sm' : 'bg-background',
            LAYER,
          )}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className={clsxm(
            'fixed flex flex-col bg-surface focus:outline-none',
            centered
              ? 'top-[8vh] left-1/2 h-[84vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-border shadow-[0_16px_48px_rgba(0,0,0,0.16)]'
              : 'inset-0',
            LAYER,
          )}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
            hide()
          }}
        >
          <Dialog.Title className="sr-only">{NAME}</Dialog.Title>
          <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
            <AssistantContent conversationId={conversationId} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Pastille({
  expanded,
  withDot,
  onClick,
  children,
}: {
  expanded: boolean
  withDot: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsxm(
        'group fixed right-6 bottom-6 flex h-12 min-w-12 items-center rounded-full bg-primary px-[13px] text-left text-primary-foreground shadow-lg transition-colors hover:bg-primary-hover print:hidden',
        LAYER,
      )}
    >
      <span className="relative flex shrink-0">
        <Sparkles className="size-[22px]" />
        {withDot ? (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 size-2.5 rounded-full bg-surface ring-2 ring-primary group-hover:hidden group-focus-visible:hidden"
          />
        ) : null}
      </span>
      <span
        className={clsxm(
          'flex items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-200',
          expanded
            ? 'ml-2 max-w-[280px] opacity-100'
            : 'max-w-0 opacity-0 group-hover:ml-2 group-hover:max-w-[280px] group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-[280px] group-focus-visible:opacity-100',
        )}
      >
        {children}
      </span>
    </button>
  )
}

const ASK = <span className="text-sm font-medium">Demander à l&apos;assistant</span>

function ConversationPastille({ conversationId }: { conversationId: string }) {
  const { restore } = useAssistantDisplay()
  const { messages, status } = useConversationState(conversationId)

  if (status === 'submitted' || status === 'streaming') {
    return (
      <Pastille expanded withDot={false} onClick={restore}>
        <span className="text-sm font-medium">L&apos;assistant rédige…</span>
      </Pastille>
    )
  }
  // Une conversation encore vide n'a rien à reprendre : l'assistant rouvre dans sa vue.
  if (messages.length === 0) {
    return (
      <Pastille expanded={false} withDot={false} onClick={restore}>
        {ASK}
      </Pastille>
    )
  }
  return (
    <Pastille expanded={false} withDot onClick={restore}>
      <span className="flex min-w-0 flex-col">
        <span className="text-[11px] leading-[14px] opacity-80">Reprendre</span>
        <span className="truncate text-[13px] leading-[17px] font-medium">
          {deriveTitle(messages)}
        </span>
      </span>
    </Pastille>
  )
}

/** Vue modale, fenêtre flottante ou pastille : ce qui se pose par-dessus la page. */
export function AssistantOverlay() {
  const { allowed, conversationId, display, open } = useAssistantDisplay()
  if (!allowed) return null

  if (!conversationId) {
    return (
      <Pastille expanded={false} withDot={false} onClick={() => open()}>
        {ASK}
      </Pastille>
    )
  }
  if (display === 'minimized') return <ConversationPastille conversationId={conversationId} />
  if (display === 'floating') return <FloatingWindow conversationId={conversationId} />
  if (display === 'fullscreen' || display === 'centered') {
    return <ModalView conversationId={conversationId} centered={display === 'centered'} />
  }
  return null
}
