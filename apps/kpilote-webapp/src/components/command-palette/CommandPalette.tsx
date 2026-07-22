import { Command as CommandPrimitive } from 'cmdk'
import { ArrowLeft, CornerDownLeft, Search } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { clsxm } from '@/lib/clsxm'
import {
  filterActions,
  filterCommands,
  type Command,
  type CommandAction,
} from '@/lib/commands/types'

import { useCommandPaletteShortcut } from './useCommandPaletteShortcut'
import { useIndicateurCommands } from './useIndicateurCommands'
import { useNavigationCommands } from './useNavigationCommands'
import { useCollectionCommands } from './useCollectionCommands'
import { useRecentlyVisitedCommands } from './useRecentlyVisitedCommands'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GROUP_HEADING_CLASS =
  '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-subtle'

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  // Item dont on affiche la page d'actions (`Tab`). `null` = liste racine.
  const [activeItem, setActiveItem] = useState<Command | null>(null)
  // Valeur cmdk de la ligne surlignée. Contrôlée : cmdk n'émet `onValueChange`
  // sur la racine que si `value` l'est aussi (indispensable pour résoudre l'item
  // ciblé au `Tab`).
  const [highlighted, setHighlighted] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Réinitialise la palette à son état racine (liste principale, requête vide).
  const resetToRoot = useCallback(() => {
    setActiveItem(null)
    setQuery('')
  }, [])

  // Ferme la palette ET réinitialise son état. `close()` est déclenché après une
  // navigation, sans passer par le `onOpenChange` du Dialog : sans ce reset,
  // rouvrir la palette la laisserait sur la page d'actions ou une requête résiduelle.
  const close = useCallback(() => {
    onOpenChange(false)
    resetToRoot()
  }, [onOpenChange, resetToRoot])

  const handleOpen = useCallback(() => onOpenChange(true), [onOpenChange])
  useCommandPaletteShortcut(handleOpen)

  const navigationCommands = filterCommands(useNavigationCommands(close), query)
  const recentCommands = useRecentlyVisitedCommands(open, close)
  const indicateurCommands = useIndicateurCommands(query, open, close)
  const { commands: collectionCommands, isLoading: isLoadingCollections } = useCollectionCommands(
    query,
    open,
    close,
  )
  const isLoading = isLoadingCollections

  // Les fiches récentes servent de point de départ : on les masque dès que
  // l'utilisateur tape, les résultats de recherche (indicateurs, collections)
  // prenant alors le relais.
  const showRecents = query.trim().length === 0

  // Toutes les commandes racine affichées, indexées pour résoudre l'item
  // surligné au moment du `Tab`.
  const rootCommands = useMemo<Command[]>(
    () => [
      ...navigationCommands,
      ...(showRecents ? recentCommands : []),
      ...indicateurCommands,
      ...collectionCommands,
    ],
    [navigationCommands, showRecents, recentCommands, indicateurCommands, collectionCommands],
  )

  const highlightedCommand = useMemo(
    () => rootCommands.find((command) => command.id.toLowerCase() === highlighted.toLowerCase()),
    [rootCommands, highlighted],
  )

  const enterActions = useCallback((command: Command) => {
    if (!command.actions?.length) return
    setActiveItem(command)
    setQuery('')
  }, [])

  const exitActions = useCallback(() => {
    setActiveItem(null)
    setQuery('')
  }, [])

  // Le bouton retour du header ne vit que sur une page d'actions : en revenant à
  // la racine il est démonté, ce qui ferait tomber le focus sur `<body>` et
  // couperait la navigation clavier. On le rend au champ de recherche à chaque
  // changement de page.
  useEffect(() => {
    inputRef.current?.focus()
  }, [activeItem])

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) resetToRoot()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Sur une page d'actions : Esc / Backspace (champ vide) reviennent en
    // arrière au lieu de fermer la palette.
    if (activeItem) {
      if (event.key === 'Escape' || (event.key === 'Backspace' && query.length === 0)) {
        event.preventDefault()
        exitActions()
      }
      return
    }
    // À la racine : `Tab` ouvre les actions de l'item surligné (si actionnable).
    // On neutralise `Tab` dans tous les cas pour ne pas perdre le focus.
    if (
      event.key === 'Tab' &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault()
      if (highlightedCommand?.actions?.length) enterActions(highlightedCommand)
    }
  }

  const pageActions = activeItem ? filterActions(activeItem.actions ?? [], query) : []

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-label="Palette de commandes"
          className="fixed left-1/2 top-[15vh] z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.16)] focus:outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Rechercher une page ou un indicateur
          </DialogPrimitive.Title>
          <CommandPrimitive
            shouldFilter={false}
            label="Palette de commandes"
            value={highlighted}
            onValueChange={setHighlighted}
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-2 border-b border-border px-3.5">
              {activeItem ? (
                <button
                  type="button"
                  onClick={exitActions}
                  aria-label="Retour aux résultats"
                  className="-ml-1 shrink-0 rounded p-1 text-text-muted hover:bg-surface-tinted hover:text-text"
                >
                  <ArrowLeft className="size-4" />
                </button>
              ) : (
                <Search className="size-4 shrink-0 text-text-muted" />
              )}
              <CommandPrimitive.Input
                ref={inputRef}
                value={query}
                onValueChange={setQuery}
                placeholder={
                  activeItem
                    ? `Actions sur « ${activeItem.label} »…`
                    : 'Rechercher une page, un indicateur…'
                }
                className="h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
              />
            </div>
            <CommandPrimitive.List className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
              <CommandPrimitive.Empty className="px-3 py-8 text-center text-sm text-text-muted">
                {activeItem ? 'Aucune action.' : isLoading ? 'Recherche…' : 'Aucun résultat.'}
              </CommandPrimitive.Empty>

              {activeItem ? (
                pageActions.map((action) => <ActionRow key={action.id} action={action} />)
              ) : (
                <>
                  {navigationCommands.length > 0 ? (
                    <CommandPrimitive.Group heading="Navigation" className={GROUP_HEADING_CLASS}>
                      {navigationCommands.map((command) => (
                        <CommandRow key={command.id} command={command} />
                      ))}
                    </CommandPrimitive.Group>
                  ) : null}

                  {showRecents && recentCommands.length > 0 ? (
                    <CommandPrimitive.Group
                      heading="Visité récemment"
                      className={GROUP_HEADING_CLASS}
                    >
                      {recentCommands.map((command) => (
                        <CommandRow key={command.id} command={command} />
                      ))}
                    </CommandPrimitive.Group>
                  ) : null}

                  {indicateurCommands.length > 0 ? (
                    <CommandPrimitive.Group heading="Indicateurs" className={GROUP_HEADING_CLASS}>
                      {indicateurCommands.map((command) => (
                        <CommandRow key={command.id} command={command} />
                      ))}
                    </CommandPrimitive.Group>
                  ) : null}

                  {collectionCommands.length > 0 ? (
                    <CommandPrimitive.Group heading="Collections" className={GROUP_HEADING_CLASS}>
                      {collectionCommands.map((command) => (
                        <CommandRow key={command.id} command={command} />
                      ))}
                    </CommandPrimitive.Group>
                  ) : null}
                </>
              )}
            </CommandPrimitive.List>

            <PaletteFooter
              inActions={Boolean(activeItem)}
              showActionsHint={Boolean(highlightedCommand?.actions?.length)}
            />
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

function CommandRow({ command }: { command: Command }) {
  const Icon = command.icon
  return (
    <CommandPrimitive.Item
      value={command.id}
      onSelect={command.run}
      className={clsxm(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text outline-none',
        'data-[selected=true]:bg-surface-tinted data-[selected=true]:text-primary',
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0 text-text-muted" /> : null}
      <span className="min-w-0 flex-1 truncate">{command.label}</span>
      {command.hint ? (
        <span className="shrink-0 font-mono text-xs text-text-subtle">{command.hint}</span>
      ) : null}
    </CommandPrimitive.Item>
  )
}

function ActionRow({ action }: { action: CommandAction }) {
  const Icon = action.icon
  return (
    <CommandPrimitive.Item
      value={action.id}
      onSelect={action.run}
      className={clsxm(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text outline-none',
        'data-[selected=true]:bg-surface-tinted data-[selected=true]:text-primary',
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0 text-text-muted" /> : null}
      <span className="min-w-0 flex-1 truncate">{action.label}</span>
      {action.hint ? (
        <span className="shrink-0 font-mono text-xs text-text-subtle">{action.hint}</span>
      ) : null}
    </CommandPrimitive.Item>
  )
}

function PaletteFooter({
  inActions,
  showActionsHint,
}: {
  inActions: boolean
  showActionsHint: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-4 border-t border-border px-3.5 py-2 text-xs text-text-subtle">
      {inActions ? (
        <>
          <FooterHint keys={<KeyChip icon={CornerDownLeft} />} label="Exécuter" />
          <FooterHint keys={<KeyChip>Échap</KeyChip>} label="Retour" />
        </>
      ) : (
        <>
          <FooterHint keys={<KeyChip icon={CornerDownLeft} />} label="Aller à" />
          {showActionsHint ? <FooterHint keys={<KeyChip>Tab</KeyChip>} label="Actions" /> : null}
        </>
      )}
    </div>
  )
}

function FooterHint({ keys, label }: { keys: ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {keys}
      <span>{label}</span>
    </span>
  )
}

function KeyChip({
  children,
  icon: Icon,
  className,
}: {
  children?: ReactNode
  icon?: typeof CornerDownLeft
  className?: string
}) {
  return (
    <kbd
      className={clsxm(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-tinted px-1 font-sans text-[11px] font-medium text-text-muted',
        className,
      )}
    >
      {Icon ? <Icon className="size-3" /> : children}
    </kbd>
  )
}
