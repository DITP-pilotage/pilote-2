import { useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { LifeBuoy, FileText } from 'lucide-react'
import { useMemo } from 'react'

import { type Command, type CommandAction } from '@/lib/commands/types'
import { normaliserTexte } from '@/lib/texte'
import { articlesCentreAidePubliesQueryOptions } from '@/queries/centreAide'

const MAX_RESULTS = 8
const LONGUEUR_EXTRAIT = 140

type Extrait = { texte: string; match?: { start: number; end: number } }

// Localise `requeteNormalisee` dans `texte` en renvoyant la plage d'indices
// ORIGINAUX. La normalisation (NFD, accents) peut changer la longueur, donc on
// mappe chaque caractère normalisé vers sa position d'origine.
const localiserMatch = (texte: string, requeteNormalisee: string): [number, number] | null => {
  let normalise = ''
  const indexOrigine: number[] = []
  for (let i = 0; i < texte.length; i++) {
    for (const caractere of normaliserTexte(texte[i] ?? '')) {
      normalise += caractere
      indexOrigine.push(i)
    }
  }
  const position = normalise.indexOf(requeteNormalisee)
  if (position === -1) return null
  const debut = indexOrigine[position] ?? 0
  const fin = (indexOrigine[position + requeteNormalisee.length - 1] ?? debut) + 1
  return [debut, fin]
}

// Extrait centré sur le terme, avec la plage du match (relative à l'extrait) pour
// la mise en gras.
const construireExtrait = (texte: string, requeteNormalisee: string): Extrait => {
  const plage = localiserMatch(texte, requeteNormalisee)
  if (!plage) return { texte: texte.slice(0, LONGUEUR_EXTRAIT).trim() }

  const [positionMatch, finMatch] = plage
  const debut = Math.max(0, Math.round(positionMatch - LONGUEUR_EXTRAIT / 3))
  const fin = Math.min(texte.length, Math.round(finMatch + (LONGUEUR_EXTRAIT * 2) / 3))
  const prefixe = debut > 0 ? '… ' : ''
  const brut = texte.slice(debut, fin)
  const rognesGauche = brut.length - brut.trimStart().length
  const corps = brut.trim()
  const base = prefixe.length - rognesGauche
  return {
    texte: `${prefixe}${corps}${fin < texte.length ? ' …' : ''}`,
    match: { start: base + (positionMatch - debut), end: base + (finMatch - debut) },
  }
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
      .map((article) => {
        const extrait = construireExtrait(article.contenuTexte, requete)
        return {
          id: `centre-aide:${article.id}`,
          label: article.titreAffiche || article.titre || '(sans titre)',
          group: 'centre-aide',
          icon: FileText,
          description: extrait.texte,
          ...(extrait.match ? { descriptionMatch: extrait.match } : {}),
          run: () => ouvrirArticle(article.id),
        }
      })
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
      // Rendu dans le groupe Navigation, à la suite des pages principales.
      group: 'navigation',
      keywords: ['aide', 'faq', 'documentation', 'help', 'support'],
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
