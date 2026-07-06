import { Command as CommandPrimitive } from 'cmdk'
import { Search } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { useCallback, useState } from 'react'

import { clsxm } from '@/lib/clsxm'
import { filterCommands, type Command } from '@/lib/commands/types'

import { useCommandPaletteShortcut } from './useCommandPaletteShortcut'
import { useIndicateurCommands } from './useIndicateurCommands'
import { useNavigationCommands } from './useNavigationCommands'
import { usePanierCommands } from './usePanierCommands'
import { useRecentlyVisitedCommands } from './useRecentlyVisitedCommands'

type CommandPaletteProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const GROUP_HEADING_CLASS =
  '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-text-subtle'

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState('')

  const close = useCallback(() => onOpenChange(false), [onOpenChange])
  const handleOpen = useCallback(() => onOpenChange(true), [onOpenChange])
  useCommandPaletteShortcut(handleOpen)

  const navigationCommands = filterCommands(useNavigationCommands(close), query)
  const recentCommands = useRecentlyVisitedCommands(open, close)
  const { commands: indicateurCommands, isLoading: isLoadingIndicateurs } = useIndicateurCommands(
    query,
    close,
  )
  const { commands: panierCommands, isLoading: isLoadingPaniers } = usePanierCommands(query, close)
  const isLoading = isLoadingIndicateurs || isLoadingPaniers

  // Les fiches récentes servent de point de départ : on les masque dès que
  // l'utilisateur tape, la recherche serveur prenant alors le relais.
  const showRecents = query.trim().length === 0

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) setQuery('')
  }

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
          <CommandPrimitive shouldFilter={false} label="Palette de commandes">
            <div className="flex items-center gap-2 border-b border-border px-3.5">
              <Search className="size-4 shrink-0 text-text-muted" />
              <CommandPrimitive.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Rechercher une page, un indicateur…"
                className="h-12 w-full bg-transparent text-sm text-text outline-none placeholder:text-text-subtle"
              />
            </div>
            <CommandPrimitive.List className="max-h-[min(24rem,60vh)] overflow-y-auto p-1.5">
              <CommandPrimitive.Empty className="px-3 py-8 text-center text-sm text-text-muted">
                {isLoading ? 'Recherche…' : 'Aucun résultat.'}
              </CommandPrimitive.Empty>

              {navigationCommands.length > 0 ? (
                <CommandPrimitive.Group heading="Navigation" className={GROUP_HEADING_CLASS}>
                  {navigationCommands.map((command) => (
                    <CommandRow key={command.id} command={command} />
                  ))}
                </CommandPrimitive.Group>
              ) : null}

              {showRecents && recentCommands.length > 0 ? (
                <CommandPrimitive.Group heading="Visité récemment" className={GROUP_HEADING_CLASS}>
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

              {panierCommands.length > 0 ? (
                <CommandPrimitive.Group heading="Paniers" className={GROUP_HEADING_CLASS}>
                  {panierCommands.map((command) => (
                    <CommandRow key={command.id} command={command} />
                  ))}
                </CommandPrimitive.Group>
              ) : null}
            </CommandPrimitive.List>
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
