import { useNavigate } from '@tanstack/react-router'
import { Mail, Search } from 'lucide-react'
import { Suspense, useState } from 'react'

import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { RaccourciKbd } from '@/components/command-palette/RaccourciKbd'
import { UserMenu } from '@/components/UserMenu'
import { Button } from '@pilote/kpilote-ui/Button'
import type { Auth } from '@/auth'

/**
 * Barre de navigation du header : recherche (⌘K / Ctrl+K) et menu utilisateur.
 * Regroupe toute la logique liée à la command palette et à l'état
 * d'authentification, pour garder le layout racine (`__root`) minimal.
 */
export function HeaderNav({ auth }: { auth: Auth }) {
  const navigate = useNavigate()
  const [paletteOpen, setPaletteOpen] = useState(false)

  return (
    <>
      <nav className="flex items-center gap-1 sm:gap-2">
        {auth.isAuthenticated ? (
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Ouvrir la recherche"
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-subtle transition-colors hover:border-border-strong hover:text-text sm:min-w-96 sm:px-3"
          >
            <Search className="size-4 shrink-0" />
            <span className="hidden sm:inline">Rechercher un indicateur, un dossier, …</span>
            <RaccourciKbd className="ml-auto hidden sm:inline-block" />
          </button>
        ) : null}

        <div className="mx-2 hidden h-6 w-px bg-border sm:block" />

        <a
          href="mailto:pilote.ditp@modernisation.gouv.fr"
          className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-surface-tinted sm:inline-flex"
        >
          <Mail className="size-4" />
          Contacter l'équipe PILOTE
        </a>

        {auth.isAuthenticated && auth.user ? (
          <UserMenu
            user={auth.user}
            onLogout={() => {
              void auth.logout()
            }}
          />
        ) : (
          <Button size="sm" type="button" onClick={() => void navigate({ to: '/login' })}>
            Se connecter
          </Button>
        )}
      </nav>

      {auth.isAuthenticated ? (
        <Suspense fallback={null}>
          <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
        </Suspense>
      ) : null}
    </>
  )
}
