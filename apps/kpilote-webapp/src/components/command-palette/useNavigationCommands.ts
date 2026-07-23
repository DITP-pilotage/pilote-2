import { useNavigate } from '@tanstack/react-router'
import { BarChart3, FolderOpen, Home } from 'lucide-react'
import { useMemo } from 'react'

import type { Command } from '@/lib/commands/types'

/**
 * Commandes de navigation « classique » vers les pages principales de l'app.
 * Chaque `run()` navigue puis ferme la palette.
 */
export function useNavigationCommands(close: () => void): Command[] {
  const navigate = useNavigate()

  return useMemo<Command[]>(
    () => [
      {
        id: 'nav:accueil',
        label: 'Accueil',
        group: 'navigation',
        icon: Home,
        keywords: ['home', 'tableau de bord'],
        run: () => {
          void navigate({ to: '/' })
          close()
        },
      },
      {
        id: 'nav:indicateurs',
        label: 'Indicateurs',
        group: 'navigation',
        icon: BarChart3,
        keywords: ['tableau de bord', 'mesures'],
        run: () => {
          void navigate({ to: '/indicateurs', search: {} })
          close()
        },
      },
      {
        id: 'nav:collections',
        label: 'Collections',
        group: 'navigation',
        icon: FolderOpen,
        keywords: ['collections'],
        run: () => {
          void navigate({ to: '/collections', search: {} })
          close()
        },
      },
    ],
    [navigate, close],
  )
}
