import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LifeBuoy, FileText } from 'lucide-react'
import { useMemo } from 'react'

import { type Command, type CommandAction } from '@/lib/commands/types'
import { normaliserTexte } from '@/lib/texte'
import { articlesCentreAidePubliesQueryOptions } from '@/queries/centreAide'

const MAX_RESULTS = 8
const LONGUEUR_EXTRAIT = 140

// Construit un extrait de `texte` centré autour de la position du terme recherché.
const construireExtrait = (texte: string, requeteNormalisee: string): string => {
  const position = normaliserTexte(texte).indexOf(requeteNormalisee)
  if (position === -1) return texte.slice(0, LONGUEUR_EXTRAIT).trim()

  const debut = Math.max(0, position - LONGUEUR_EXTRAIT / 3)
  const fin = Math.min(
    texte.length,
    position + requeteNormalisee.length + (LONGUEUR_EXTRAIT * 2) / 3,
  )
  const extrait = texte.slice(debut, fin).trim()
  return `${debut > 0 ? '… ' : ''}${extrait}${fin < texte.length ? ' …' : ''}`
}

type ResultatCentreAide = {
  /** Résultats de recherche (articles qui matchent), affichés quand on tape. */
  results: Command[]
  /** Entrée « Centre d'aide » par défaut, avec la liste des articles en actions (Tab). */
  entry: Command | null
}

/**
 * Recherche + point d'entrée du centre d'aide dans la palette. Réutilise la MÊME
 * query que la page lecteur (`articlesCentreAidePubliesQueryOptions`) : cache
 * partagé, pas d'appel supplémentaire si le centre d'aide a déjà été visité.
 * Filtrage (titre + `contenuTexte`) et extrait calculés côté client. Chaque
 * résultat ouvre `/centre-aide?article=<id>`.
 */
export function useCentreAideCommands(
  query: string,
  open: boolean,
  close: () => void,
): ResultatCentreAide {
  const navigate = useNavigate()
  const { data } = useQuery({ ...articlesCentreAidePubliesQueryOptions(), enabled: open })

  const pages = useMemo(() => (data ?? []).filter((article) => article.type === 'PAGE'), [data])

  const ouvrirArticle = useMemo(
    () => (id: string) => {
      void navigate({ to: '/centre-aide', search: { article: id } })
      close()
    },
    [navigate, close],
  )

  const results = useMemo<Command[]>(() => {
    const requete = normaliserTexte(query.trim())
    if (requete.length === 0) return []

    return pages
      .filter(
        (article) =>
          normaliserTexte(article.titreAffiche || article.titre).includes(requete) ||
          normaliserTexte(article.contenuTexte).includes(requete),
      )
      .slice(0, MAX_RESULTS)
      .map((article) => ({
        id: `centre-aide:${article.id}`,
        label: article.titreAffiche || article.titre || '(sans titre)',
        group: 'centre-aide',
        icon: FileText,
        description: construireExtrait(article.contenuTexte, requete),
        run: () => ouvrirArticle(article.id),
      }))
  }, [pages, query, ouvrirArticle])

  const entry = useMemo<Command | null>(() => {
    if (pages.length === 0) return null
    const actions: CommandAction[] = pages.map((article) => ({
      id: `centre-aide-article:${article.id}`,
      label: article.titreAffiche || article.titre || '(sans titre)',
      icon: FileText,
      run: () => ouvrirArticle(article.id),
    }))
    return {
      id: 'centre-aide-entry',
      label: 'Centre d’aide',
      group: 'centre-aide',
      icon: LifeBuoy,
      run: () => {
        void navigate({ to: '/centre-aide', search: { article: undefined } })
        close()
      },
      actions,
    }
  }, [pages, ouvrirArticle, navigate, close])

  return { results, entry }
}
