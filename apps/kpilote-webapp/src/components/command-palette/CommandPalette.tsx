import { Command as CommandPrimitive } from 'cmdk'
import { ArrowLeft, CornerDownLeft, Search, Sparkles } from 'lucide-react'
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

import { analyticsEvents } from '@pilote/kpilote-shared/analytics/events'
import { bucketQueryLength } from '@pilote/kpilote-shared/analytics/buckets'

import { analytics } from '@/analytics/tracker'
import { clsxm } from '@/lib/clsxm'
import {
  filterActions,
  filterCommands,
  type Command,
  type CommandAction,
} from '@/lib/commands/types'

import { actionTypeFromActionId, targetTypeFromCommandId } from './commandTargets'
import { useRaccourciPalette } from './RaccourciKbd'
import { useCentreAideCommands } from './useCentreAideCommands'
import { useCommandPaletteShortcut } from './useCommandPaletteShortcut'
import { useIndicateurCommands } from './useIndicateurCommands'
import { useNavigationCommands } from './useNavigationCommands'
import { useCollectionCommands } from './useCollectionCommands'
import { useRecentlyVisitedCommands } from './useRecentlyVisitedCommands'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  openAssistant: (question: string) => void
  /** Requête présente à l'ouverture — le retour depuis l'assistant rend sa question. */
  initialQuery?: string
}

const NAVIGATION_KEYS = new Set(['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'])

const GROUP_HEADING_CLASS =
  '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-subtle'

export function CommandPalette({
  open,
  onOpenChange,
  openAssistant,
  initialQuery,
}: CommandPaletteProps) {
  // État initial seulement : l'appelant remonte le composant (`key`) quand il change.
  const [query, setQuery] = useState(initialQuery ?? '')
  // Item dont on affiche la page d'actions (`Tab` depuis la liste). `null` = liste racine.
  const [activeItem, setActiveItem] = useState<Command | null>(null)
  // Valeur cmdk de la ligne surlignée. Contrôlée : cmdk n'émet `onValueChange`
  // sur la racine que si `value` l'est aussi (indispensable pour résoudre l'item
  // ciblé au `Tab`).
  const [highlighted, setHighlighted] = useState('')
  // Vrai dès que l'utilisateur est « descendu » dans la liste (flèches, ou pointeur
  // dessus). Le focus DOM ne bouge jamais de l'input avec cmdk : c'est ce drapeau qui
  // dit si `Tab` s'adresse au champ de recherche (assistant) ou à la ligne surlignée
  // (ses actions). Retombe à faux dès que la requête change.
  const [inList, setInList] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Réinitialise la palette à son état racine (liste principale, requête vide).
  const resetToRoot = useCallback(() => {
    setActiveItem(null)
    setQuery('')
    setInList(false)
  }, [])

  // Ferme la palette ET réinitialise son état. `close()` est déclenché après une
  // navigation, sans passer par le `onOpenChange` du Dialog : sans ce reset,
  // rouvrir la palette la laisserait sur la page d'actions ou une requête résiduelle.
  const close = useCallback(() => {
    onOpenChange(false)
    resetToRoot()
  }, [onOpenChange, resetToRoot])

  const handleOpen = useCallback(() => {
    // Le raccourci reste actif palette ouverte : sans ce garde, chaque ⌘K
    // supplémentaire compterait une ouverture de plus.
    if (!open) analytics.trackEvent(analyticsEvents.commandPalette.open({ method: 'keyboard' }))
    onOpenChange(true)
  }, [onOpenChange, open])
  useCommandPaletteShortcut(handleOpen)

  // La demande à l'IA n'est plus une ligne de résultat : elle est attachée au champ
  // de recherche, comme le fait Raycast. La question part telle quelle avec sa surface,
  // le moteur ne devine rien de l'intention.
  const askAssistant = useCallback(() => {
    analytics.trackEvent(
      analyticsEvents.commandPalette.commandRun({
        command_group: 'assistant',
        target_type: 'assistant',
      }),
    )
    const question = query.trim()
    close()
    openAssistant(question)
  }, [close, openAssistant, query])
  const recentCommands = useRecentlyVisitedCommands(open, close)
  const indicateurCommands = useIndicateurCommands(query, open, close)
  const { commands: collectionCommands, isLoading: isLoadingCollections } = useCollectionCommands(
    query,
    open,
    close,
  )
  const navigationBase = useNavigationCommands(close)
  const { results: centreAideResults, entry: centreAideEntry } = useCentreAideCommands(
    query,
    open,
    close,
  )
  // L'entrée « Centre d'aide » vit dans le groupe Navigation, à la suite des pages
  // principales, et se filtre comme les autres commandes de navigation.
  const navigationCommands = filterCommands(
    centreAideEntry ? [...navigationBase, centreAideEntry] : navigationBase,
    query,
  )
  const isLoading = isLoadingCollections

  // Les fiches récentes servent de point de départ : on les masque dès que
  // l'utilisateur tape, les résultats de recherche (indicateurs, collections)
  // prenant alors le relais.
  const showRecents = query.trim().length === 0

  // Toutes les commandes racine affichées, indexées pour résoudre l'item
  // surligné au moment du ⌘K.
  const rootCommands = useMemo<Command[]>(
    () => [
      ...navigationCommands,
      ...(showRecents ? recentCommands : []),
      ...indicateurCommands,
      ...collectionCommands,
      ...centreAideResults,
    ],
    [
      navigationCommands,
      showRecents,
      recentCommands,
      indicateurCommands,
      collectionCommands,
      centreAideResults,
    ],
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

  // Radix écoute `Échap` sur le document en phase de capture et ferme le Dialog si rien
  // n'a annulé l'événement avant lui — son `onEscapeKeyDown` n'a pas suffi ici, le
  // gestionnaire qu'il retient ne suivait pas `activeItem`. Sur une page d'actions on se
  // place donc encore avant, sur `window`, pour remonter d'un niveau au lieu de fermer.
  useEffect(() => {
    if (!activeItem) return
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      exitActions()
    }
    window.addEventListener('keydown', handleEscape, { capture: true })
    return () => window.removeEventListener('keydown', handleEscape, { capture: true })
  }, [activeItem, exitActions])

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) resetToRoot()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Sur une page d'actions : Esc, ⇧Tab et Backspace (champ vide) reviennent en
    // arrière au lieu de fermer la palette.
    if (activeItem) {
      if (
        event.key === 'Escape' ||
        (event.key === 'Tab' && event.shiftKey) ||
        (event.key === 'Backspace' && query.length === 0)
      ) {
        event.preventDefault()
        exitActions()
      }
      return
    }
    if (NAVIGATION_KEYS.has(event.key)) setInList(true)

    // `Tab` a deux sens selon l'endroit : sur le champ de recherche, il transmet la
    // requête à l'assistant — c'est ce que l'affordance du champ annonce ; une fois
    // descendu dans la liste, il ouvre les actions de la ligne surlignée. Neutralisé
    // dans tous les cas pour ne pas perdre le focus.
    if (
      event.key === 'Tab' &&
      !event.shiftKey &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault()
      if (!inList) {
        askAssistant()
      } else if (highlightedCommand?.actions?.length) {
        enterActions(highlightedCommand)
      }
      return
    }
    // ⌘K ouvre les actions depuis n'importe où, comme chez Raycast. Le raccourci global
    // d'ouverture ignore les champs de saisie, et le focus vit dans l'input : aucune
    // collision possible avec la réouverture de la palette.
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (highlightedCommand?.actions?.length) enterActions(highlightedCommand)
    }
  }

  const resultsCount = rootCommands.length

  // La requête est synchronisée à chaque frappe : sans ce délai, taper « indic »
  // enverrait cinq événements de recherche. On ne mesure que la requête sur
  // laquelle l'utilisateur s'arrête.
  useEffect(() => {
    if (!open || activeItem) return
    const trimmed = query.trim()
    if (trimmed.length === 0) return

    const timer = setTimeout(() => {
      analytics.trackEvent(analyticsEvents.commandPalette.search({ results_count: resultsCount }))
      if (resultsCount === 0) {
        analytics.trackEvent(
          analyticsEvents.commandPalette.noResult({
            query_length_bucket: bucketQueryLength(trimmed.length),
          }),
        )
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [open, activeItem, query, resultsCount])

  const pageActions = activeItem ? filterActions(activeItem.actions ?? [], query) : []

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          aria-label="Palette de commandes"
          className="fixed left-1/2 top-[8vh] z-50 flex h-[84vh] w-[min(56rem,calc(100vw-2rem))] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-[0_16px_48px_rgba(0,0,0,0.16)] focus:outline-none"
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
            className="flex min-h-0 flex-1 flex-col"
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
                onValueChange={(value) => {
                  setQuery(value)
                  setInList(false)
                }}
                placeholder={
                  activeItem
                    ? `Actions sur « ${activeItem.label} »…`
                    : 'Rechercher une page, un indicateur…'
                }
                className="h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
              />
              {activeItem ? null : <AskAiTrigger onAsk={askAssistant} />}
            </div>
            <CommandPrimitive.List
              className="min-h-0 flex-1 overflow-y-auto p-1.5"
              onPointerMove={() => setInList(true)}
            >
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

                  {centreAideResults.length > 0 ? (
                    <CommandPrimitive.Group heading="Centre d’aide" className={GROUP_HEADING_CLASS}>
                      {centreAideResults.map((command) => (
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
              inList={inList}
            />
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

/**
 * « Demander à l'IA » vit dans la barre de recherche, pas dans les résultats : la
 * question posée EST la recherche en cours, et non une commande à trouver parmi
 * d'autres. Cliquable à la souris, et annoncé au clavier par la touche qu'il porte.
 */
function AskAiTrigger({ onAsk }: { onAsk: () => void }) {
  return (
    <button
      type="button"
      onClick={onAsk}
      aria-keyshortcuts="Tab"
      className="flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-text-muted transition-colors hover:bg-surface-tinted hover:text-text"
    >
      <Sparkles className="size-3.5" aria-hidden />
      Demander à l'IA
      <KeyChip>Tab</KeyChip>
    </button>
  )
}

function CommandRow({ command }: { command: Command }) {
  const Icon = command.icon
  return (
    <CommandPrimitive.Item
      value={command.id}
      onSelect={() => {
        analytics.trackEvent(
          analyticsEvents.commandPalette.commandRun({
            command_group: command.group,
            target_type: targetTypeFromCommandId(command.id),
          }),
        )
        command.run()
      }}
      className={clsxm(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text outline-none',
        'data-[selected=true]:bg-surface-tinted data-[selected=true]:text-primary',
      )}
    >
      {Icon ? <Icon className="size-4 shrink-0 self-start text-text-muted [&]:mt-0.5" /> : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{command.label}</span>
        {command.description ? (
          <span className="mt-0.5 block truncate text-xs text-text-subtle">
            <Extrait texte={command.description} match={command.descriptionMatch} />
          </span>
        ) : null}
      </span>
      {command.hint ? (
        <span className="shrink-0 self-start font-mono text-xs text-text-subtle">
          {command.hint}
        </span>
      ) : null}
    </CommandPrimitive.Item>
  )
}

// Rend l'extrait avec le terme matché en gras (plage `match` fournie par la source).
function Extrait({
  texte,
  match,
}: {
  texte: string
  match: { start: number; end: number } | undefined
}) {
  if (!match || match.start < 0 || match.end > texte.length || match.start >= match.end) {
    return <>{texte}</>
  }
  return (
    <>
      {texte.slice(0, match.start)}
      <strong className="font-semibold text-text">{texte.slice(match.start, match.end)}</strong>
      {texte.slice(match.end)}
    </>
  )
}

function ActionRow({ action }: { action: CommandAction }) {
  const Icon = action.icon
  return (
    <CommandPrimitive.Item
      value={action.id}
      onSelect={() => {
        analytics.trackEvent(
          analyticsEvents.commandPalette.actionRun({
            action_type: actionTypeFromActionId(action.id),
            target_type: targetTypeFromCommandId(action.id),
          }),
        )
        action.run()
      }}
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
  inList,
}: {
  inActions: boolean
  showActionsHint: boolean
  inList: boolean
}) {
  const raccourciActions = useRaccourciPalette()

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
          {showActionsHint ? (
            <FooterHint
              keys={<KeyChip>{inList ? 'Tab' : raccourciActions}</KeyChip>}
              label="Actions"
            />
          ) : null}
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
