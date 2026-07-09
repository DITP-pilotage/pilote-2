import { Link, useLocation, useNavigate, useSearch } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { Suspense, useState, type ReactNode } from 'react'

import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { RaccourciKbd } from '@/components/command-palette/RaccourciKbd'
import { UserMenu } from '@/components/UserMenu'
import { Button } from '@/components/ui/Button'
import type { Auth } from '@/auth'

/**
 * Barre de navigation du header : recherche (⌘K / Ctrl+K), lien tableau de bord
 * et menu utilisateur. Regroupe toute la logique liée à la command palette et à
 * l'état d'authentification, pour garder le layout racine (`__root`) minimal.
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
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-subtle transition-colors hover:border-border-strong hover:text-text sm:px-3"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Rechercher…</span>
            <RaccourciKbd className="ml-4 hidden sm:inline-block" />
          </button>
        ) : null}

        <NavLink>Tableau de bord</NavLink>

        <div className="mx-2 hidden h-6 w-px bg-border sm:block" />

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

function NavLink({ children }: { children: ReactNode }) {
  const search = useSearch({ strict: false })
  const { pathname } = useLocation()
  const isActive = pathname.startsWith('/indicateurs') || pathname.startsWith('/paniers')
  return (
    <Link
      to="/indicateurs"
      search={{ individu: search.individu, referentiel: search.referentiel }}
      data-status={isActive ? 'active' : undefined}
      className="rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-surface-tinted hover:text-primary data-[status=active]:bg-primary-tinted data-[status=active]:text-primary"
    >
      {children}
    </Link>
  )
}
