import { describe, expect, it } from 'vitest'

import type { MePermissionsApiModel } from '@pilote/kpilote-shared/mePermissions'
import {
  CollectionPermissionAction,
  IndicateurPermissionAction,
} from '@pilote/kpilote-shared/permission'

import { buildNodesCube, DIMENSIONS_CUBE } from '@/tests/factories/dimensions'
import {
  canWriteDataCellule,
  canWriteDataIndicateur,
  canWriteCommentIndicateur,
  canWriteCommentCollection,
} from '@/queries/mePermissions'

const base: MePermissionsApiModel = { indicateurs: [], collections: [] }

describe('canWriteDataIndicateur', () => {
  it("autorise un admin sur n'importe quel indicateur", () => {
    expect(
      canWriteDataIndicateur({ permissions: { ...base, isAdmin: true }, indicateurId: 'IND-1' }),
    ).toBe(true)
  })

  it("autorise si une entrée WRITE_DATA existe pour l'indicateur", () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: [IndicateurPermissionAction.WRITE_DATA] }],
    }
    expect(canWriteDataIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(true)
  })

  it('refuse avec seulement READ', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: [IndicateurPermissionAction.READ] }],
    }
    expect(canWriteDataIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(false)
  })

  it('refuse avec seulement WRITE_COMMENT (WRITE_COMMENT ne donne pas WRITE_DATA)', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: [IndicateurPermissionAction.WRITE_COMMENT] }],
    }
    expect(canWriteDataIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(false)
  })
})

describe('canWriteCommentIndicateur', () => {
  it("autorise un admin sur n'importe quel indicateur", () => {
    expect(
      canWriteCommentIndicateur({ permissions: { ...base, isAdmin: true }, indicateurId: 'IND-1' }),
    ).toBe(true)
  })

  it("autorise si une entrée WRITE_COMMENT existe pour l'indicateur", () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: [IndicateurPermissionAction.WRITE_COMMENT] }],
    }
    expect(canWriteCommentIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(true)
  })

  it('refuse avec seulement READ', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: [IndicateurPermissionAction.READ] }],
    }
    expect(canWriteCommentIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(false)
  })

  it('refuse avec seulement WRITE_DATA (WRITE_DATA ne donne pas WRITE_COMMENT)', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: [IndicateurPermissionAction.WRITE_DATA] }],
    }
    expect(canWriteCommentIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(false)
  })
})

describe('canWriteCommentCollection', () => {
  it("autorise un admin sur n'importe quelle collection", () => {
    expect(
      canWriteCommentCollection({ permissions: { ...base, isAdmin: true }, collectionId: 'COL-1' }),
    ).toBe(true)
  })

  it('autorise si une entrée WRITE_COMMENT existe pour la collection', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      collections: [{ id: 'COL-1', actions: [CollectionPermissionAction.WRITE_COMMENT] }],
    }
    expect(canWriteCommentCollection({ permissions, collectionId: 'COL-1' })).toBe(true)
  })

  it('refuse avec seulement READ', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      collections: [{ id: 'COL-1', actions: [CollectionPermissionAction.READ] }],
    }
    expect(canWriteCommentCollection({ permissions, collectionId: 'COL-1' })).toBe(false)
  })

  it("refuse si la collection n'est pas dans les permissions", () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      collections: [{ id: 'COL-2', actions: [CollectionPermissionAction.WRITE_COMMENT] }],
    }
    expect(canWriteCommentCollection({ permissions, collectionId: 'COL-1' })).toBe(false)
  })
})

describe('canWriteDataCellule', () => {
  const nodes = buildNodesCube()
  const DEPT_84 = { dimension: 'DIM-TERRITOIRE', individu: 'DEPT-84', referentiel: 'REF-DEPT' }
  const verifier = (permissions: MePermissionsApiModel) =>
    canWriteDataCellule({
      permissions,
      indicateurId: 'IND-101',
      coordonnees: [DEPT_84],
      nodes,
      dimensions: DIMENSIONS_CUBE,
    })

  it('sans périmètre : règle historique (WRITE_DATA suffit)', () => {
    expect(
      verifier({
        ...base,
        indicateurs: [{ id: 'IND-101', actions: [IndicateurPermissionAction.WRITE_DATA] }],
      }),
    ).toBe(true)
  })

  it('périmètre restreint : cellule dans le périmètre', () => {
    expect(
      verifier({
        ...base,
        indicateurs: [
          { id: 'IND-101', actions: [IndicateurPermissionAction.WRITE_DATA], perimetre: ['FR'] },
        ],
      }),
    ).toBe(true)
  })

  it('périmètre restreint : cellule hors périmètre', () => {
    expect(
      verifier({
        ...base,
        indicateurs: [
          {
            id: 'IND-101',
            actions: [IndicateurPermissionAction.WRITE_DATA],
            perimetre: ['DEPT-13'],
          },
        ],
      }),
    ).toBe(false)
  })

  it('admin : toujours autorisé', () => {
    expect(verifier({ ...base, isAdmin: true })).toBe(true)
  })
})
