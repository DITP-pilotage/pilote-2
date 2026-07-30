import { describe, expect, it } from 'vitest'

import type { MePermissionsApiModel } from '@pilote/kpilote-shared/mePermissions'

import { canWriteDataIndicateur } from '@/queries/mePermissions'

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
      indicateurs: [{ id: 'IND-1', actions: ['WRITE_DATA'] }],
    }
    expect(canWriteDataIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(true)
  })

  it('refuse avec seulement READ', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: ['READ'] }],
    }
    expect(canWriteDataIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(false)
  })

  it('refuse avec seulement WRITE_COMMENT (WRITE_COMMENT ne donne pas WRITE_DATA)', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: ['WRITE_COMMENT'] }],
    }
    expect(canWriteDataIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(false)
  })
})
