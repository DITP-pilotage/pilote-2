import type { AnyRouter } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { routeTitle, syncDocumentTitle } from '@/lib/pageTitle'

type FakeMatch = {
  staticData: {
    title: string | null
    documentTitle?: (loaderData: unknown) => string | undefined
  }
  loaderData?: unknown
}

// Les routes de mise en page (`__root`, `_authenticated`) encadrent toujours la
// route affichée : les matches sont reproduits dans cet ordre pour que le test
// exerce bien la remontée jusqu'au dernier titre.
const layouts: FakeMatch[] = [{ staticData: { title: null } }, { staticData: { title: null } }]

const routerAvecMatches = (matches: FakeMatch[]) => {
  let resoudre: (() => void) | undefined
  const router = {
    state: { matches },
    subscribe: (_evenement: string, callback: () => void) => {
      resoudre = callback
    },
  } as unknown as AnyRouter

  return {
    router,
    naviguer: () => {
      syncDocumentTitle(router)
      resoudre?.()
    },
  }
}

describe('syncDocumentTitle', () => {
  it('compose le titre de la route affichée avec le suffixe du produit', () => {
    const { naviguer } = routerAvecMatches([...layouts, { staticData: { title: 'Indicateurs' } }])

    naviguer()

    expect(document.title).toBe('Indicateurs — KPilote')
  })

  it("préfère le libellé de l'entité quand la route en expose un", () => {
    const { naviguer } = routerAvecMatches([
      ...layouts,
      {
        staticData: {
          title: 'Indicateur',
          documentTitle: (loaderData) =>
            (loaderData as { indicateur: { nom: string } }).indicateur.nom,
        },
        loaderData: { indicateur: { nom: 'Taux de chômage des 15-24 ans' } },
      },
    ])

    naviguer()

    expect(document.title).toBe('Taux de chômage des 15-24 ans — KPilote')
  })

  it('retombe sur le titre générique quand le loader a échoué', () => {
    const { naviguer } = routerAvecMatches([
      ...layouts,
      {
        staticData: {
          title: 'Indicateur',
          documentTitle: (loaderData) =>
            (loaderData as { indicateur: { nom: string } }).indicateur.nom,
        },
      },
    ])

    naviguer()

    expect(document.title).toBe('Indicateur — KPilote')
  })

  it("n'affiche que le produit quand aucune route ne porte de titre", () => {
    const { naviguer } = routerAvecMatches(layouts)

    naviguer()

    expect(document.title).toBe('KPilote')
  })
})

describe('routeTitle', () => {
  it("expose le titre du type de page, jamais le libellé de l'entité", () => {
    const { router } = routerAvecMatches([
      ...layouts,
      {
        staticData: {
          title: 'Indicateur',
          documentTitle: (loaderData) =>
            (loaderData as { indicateur: { nom: string } }).indicateur.nom,
        },
        loaderData: { indicateur: { nom: 'Taux de chômage des 15-24 ans' } },
      },
    ])

    expect(routeTitle(router)).toBe('Indicateur')
  })

  it('ne renvoie aucun titre quand seules des routes de mise en page sont montées', () => {
    const { router } = routerAvecMatches(layouts)

    expect(routeTitle(router)).toBeUndefined()
  })
})
