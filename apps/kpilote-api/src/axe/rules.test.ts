import { describe, expect, it } from 'vitest'

import { type ModalitesContext } from '@/axe/requestedModalites'
import {
  checkCelluleComplete,
  checkModaliteDansAxe,
  checkModalitesDeclarees,
  checkModaliteSupprimable,
  checkNiveauExiste,
  checkNiveauxSupprimables,
  checkNombreNiveauxModifiable,
  checkParentInchange,
  checkParentModalite,
  checkParentSansValeur,
} from '@/axe/rules'

describe.concurrent('checkNombreNiveauxModifiable', () => {
  it('accepte un axe qui n’existe pas encore', () => {
    const result = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: null,
      nombreNiveauxCible: 3,
      indicateursDeclarants: [],
    })
    expect(result.isOk()).toBe(true)
  })

  it('accepte un renommage, même si des indicateurs déclarent l’axe', () => {
    const result = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: 2,
      nombreNiveauxCible: 2,
      indicateursDeclarants: ['IND-1'],
    })
    expect(result.isOk()).toBe(true)
  })

  it('accepte un changement de nombre de niveaux sur un axe que personne ne déclare', () => {
    const result = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: 2,
      nombreNiveauxCible: 3,
      indicateursDeclarants: [],
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejette un changement de nombre de niveaux sur un axe déclaré, en listant les indicateurs', () => {
    const result = checkNombreNiveauxModifiable({
      nombreNiveauxActuel: 2,
      nombreNiveauxCible: 1,
      indicateursDeclarants: ['IND-1', 'IND-2'],
    })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'AXE_UTILISE',
      indicateurs: ['IND-1', 'IND-2'],
    })
  })
})

describe.concurrent('checkNiveauxSupprimables', () => {
  it('accepte de retirer des niveaux qui ne portent aucune modalité', () => {
    const result = checkNiveauxSupprimables({
      nombreNiveauxCible: 1,
      ordresPorteursDeModalites: [1],
    })
    expect(result.isOk()).toBe(true)
  })

  it('rejette le retrait de niveaux qui portent des modalités, en listant leurs ordres', () => {
    const result = checkNiveauxSupprimables({
      nombreNiveauxCible: 1,
      ordresPorteursDeModalites: [1, 2, 3],
    })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'NIVEAU_PORTE_MODALITES', ordres: [2, 3] })
  })
})

const contexte = ({
  axes,
  modalites,
}: {
  axes: string[]
  modalites: Array<{ publicId: string; axe: string; isLeaf?: boolean }>
}): ModalitesContext => ({
  declaredAxes: axes.map((axe) => ({ id: `id-${axe}`, publicId: axe })),
  modaliteByPublicId: new Map(
    modalites.map((modalite) => [
      modalite.publicId,
      {
        id: `id-${modalite.publicId}`,
        publicId: modalite.publicId,
        axeId: `id-${modalite.axe}`,
        axePublicId: modalite.axe,
        isLeaf: modalite.isLeaf ?? true,
      },
    ]),
  ),
})

const context = contexte({
  axes: ['OP', 'FR'],
  modalites: [
    { publicId: 'OP-ORANGE', axe: 'OP' },
    { publicId: 'OP-SFR', axe: 'OP' },
    { publicId: 'FR-TOUS', axe: 'FR', isLeaf: false },
    { publicId: 'FR-TVA', axe: 'FR' },
    { publicId: 'AGE-JEUNE', axe: 'AGE' },
  ],
})

describe.concurrent('checkModalitesDeclarees', () => {
  it('renvoie la modalité retenue pour chaque axe cité', () => {
    const result = checkModalitesDeclarees({ context, modalitePublicIds: ['OP-ORANGE'] })
    expect([...result._unsafeUnwrap().keys()]).toEqual(['id-OP'])
  })

  it('rejette des modalités inconnues, en les listant', () => {
    const result = checkModalitesDeclarees({ context, modalitePublicIds: ['OP-X', 'OP-ORANGE'] })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'MODALITE_INCONNUE', modalites: ['OP-X'] })
  })

  it('rejette une modalité d’un axe que l’indicateur ne déclare pas', () => {
    const result = checkModalitesDeclarees({ context, modalitePublicIds: ['AGE-JEUNE'] })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'AXE_NON_DECLARE', modalites: ['AGE-JEUNE'] })
  })

  it('rejette deux modalités du même axe', () => {
    const result = checkModalitesDeclarees({ context, modalitePublicIds: ['OP-SFR', 'OP-ORANGE'] })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'MODALITES_MEME_AXE',
      axe: 'OP',
      modalites: ['OP-ORANGE', 'OP-SFR'],
    })
  })
})

describe.concurrent('checkCelluleComplete', () => {
  it('renvoie les modalités dans l’ordre de déclaration des axes', () => {
    const result = checkCelluleComplete({ context, modalitePublicIds: ['FR-TVA', 'OP-ORANGE'] })
    expect(result._unsafeUnwrap().map((modalite) => modalite.publicId)).toEqual([
      'OP-ORANGE',
      'FR-TVA',
    ])
  })

  it('accepte une cellule sans modalité pour un indicateur sans axe', () => {
    const sansAxe = contexte({ axes: [], modalites: [] })
    expect(
      checkCelluleComplete({ context: sansAxe, modalitePublicIds: [] })._unsafeUnwrap(),
    ).toEqual([])
  })

  it('rejette une cellule à laquelle il manque un axe', () => {
    const result = checkCelluleComplete({ context, modalitePublicIds: ['OP-ORANGE'] })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'MODALITE_MANQUANTE', axes: ['FR'] })
  })

  it('rejette une modalité qui n’est pas une feuille', () => {
    const result = checkCelluleComplete({ context, modalitePublicIds: ['OP-ORANGE', 'FR-TOUS'] })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'MODALITE_NON_FEUILLE',
      modalites: ['FR-TOUS'],
    })
  })
})

describe.concurrent('checkModaliteDansAxe', () => {
  it('accepte une modalité nouvelle', () => {
    expect(checkModaliteDansAxe({ axeId: 'a', existante: null }).isOk()).toBe(true)
  })

  it('accepte une modalité existante du même axe', () => {
    const existante = { axeId: 'a', axePublicId: 'AXE-A' }
    expect(checkModaliteDansAxe({ axeId: 'a', existante }).isOk()).toBe(true)
  })

  it('rejette une modalité qui appartient à un autre axe', () => {
    const existante = { axeId: 'b', axePublicId: 'AXE-B' }
    const result = checkModaliteDansAxe({ axeId: 'a', existante })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'MODALITE_AUTRE_AXE', axe: 'AXE-B' })
  })
})

describe.concurrent('checkParentInchange', () => {
  it('accepte le même parent', () => {
    expect(checkParentInchange({ parentActuel: 'P', parentCible: 'P' }).isOk()).toBe(true)
  })

  it('rejette un changement de parent, en donnant le parent actuel', () => {
    const result = checkParentInchange({ parentActuel: null, parentCible: 'P' })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'CHANGEMENT_PARENT_INTERDIT',
      parentActuel: null,
    })
  })
})

describe.concurrent('checkParentModalite', () => {
  it('place une modalité sans parent au premier niveau', () => {
    const result = checkParentModalite({ axeId: 'a', parentPublicId: null, parent: null })
    expect(result._unsafeUnwrap()).toEqual({ parentId: null, ordre: 1 })
  })

  it('place une modalité un niveau sous son parent', () => {
    const parent = { id: 'p', axeId: 'a', axePublicId: 'AXE-A', ordre: 2 }
    const result = checkParentModalite({ axeId: 'a', parentPublicId: 'P', parent })
    expect(result._unsafeUnwrap()).toEqual({ parentId: 'p', ordre: 3 })
  })

  it('rejette un parent inconnu', () => {
    const result = checkParentModalite({ axeId: 'a', parentPublicId: 'P', parent: null })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'PARENT_INCONNU' })
  })

  it('rejette un parent d’un autre axe', () => {
    const parent = { id: 'p', axeId: 'b', axePublicId: 'AXE-B', ordre: 1 }
    const result = checkParentModalite({ axeId: 'a', parentPublicId: 'P', parent })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'PARENT_AUTRE_AXE', axe: 'AXE-B' })
  })
})

describe.concurrent('checkNiveauExiste', () => {
  it('renvoie le niveau de l’ordre demandé', () => {
    const niveau = { id: 'n2', ordre: 2 }
    expect(
      checkNiveauExiste({ niveaux: [{ id: 'n1', ordre: 1 }, niveau], ordre: 2 })._unsafeUnwrap(),
    ).toBe(niveau)
  })

  it('rejette un ordre au-delà des niveaux de l’axe', () => {
    const result = checkNiveauExiste({ niveaux: [{ id: 'n1', ordre: 1 }], ordre: 2 })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'NIVEAU_INEXISTANT', ordre: 2 })
  })
})

describe.concurrent('checkParentSansValeur', () => {
  it('accepte une modalité du premier niveau', () => {
    expect(checkParentSansValeur({ parent: null }).isOk()).toBe(true)
  })

  it('accepte un parent qui ne porte aucune valeur', () => {
    expect(
      checkParentSansValeur({
        parent: { publicId: 'P1', nombreValeurs: 0, nombreEnfants: 0 },
      }).isOk(),
    ).toBe(true)
  })

  it('accepte un parent qui a déjà des enfants, même s’il porte des valeurs', () => {
    expect(
      checkParentSansValeur({
        parent: { publicId: 'P1', nombreValeurs: 3, nombreEnfants: 1 },
      }).isOk(),
    ).toBe(true)
  })

  it('rejette un parent qui porte des valeurs, en donnant leur nombre', () => {
    const result = checkParentSansValeur({
      parent: { publicId: 'P1', nombreValeurs: 3, nombreEnfants: 0 },
    })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'PARENT_PORTE_VALEURS',
      parent: 'P1',
      valeurs: 3,
    })
  })
})

describe.concurrent('checkModaliteSupprimable', () => {
  it('accepte une feuille qu’aucune valeur n’utilise', () => {
    expect(checkModaliteSupprimable({ enfants: [], nombreValeurs: 0 }).isOk()).toBe(true)
  })

  it('rejette une modalité qui a des enfants, en les listant', () => {
    const result = checkModaliteSupprimable({ enfants: ['E1', 'E2'], nombreValeurs: 3 })
    expect(result._unsafeUnwrapErr()).toEqual({
      type: 'MODALITE_A_DES_ENFANTS',
      enfants: ['E1', 'E2'],
    })
  })

  it('rejette une modalité qui précise des valeurs', () => {
    const result = checkModaliteSupprimable({ enfants: [], nombreValeurs: 3 })
    expect(result._unsafeUnwrapErr()).toEqual({ type: 'MODALITE_UTILISEE', valeurs: 3 })
  })
})
