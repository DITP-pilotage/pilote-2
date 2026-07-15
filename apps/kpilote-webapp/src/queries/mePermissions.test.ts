import { describe, expect, it } from 'vitest'

import type { MePermissionsApiModel } from '@pilote/kpilote-shared/mePermissions'

import { canWriteIndicateur } from '@/queries/mePermissions'

const base: MePermissionsApiModel = { indicateurs: [], dossiers: [] }

describe('canWriteIndicateur', () => {
  it("autorise un admin sur n'importe quel indicateur", () => {
    expect(
      canWriteIndicateur({ permissions: { ...base, isAdmin: true }, indicateurId: 'IND-1' }),
    ).toBe(true)
  })

  it("autorise si une entree WRITE existe pour l'indicateur", () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: ['WRITE'] }],
    }
    expect(canWriteIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(true)
  })

  it('refuse sans entree WRITE', () => {
    const permissions: MePermissionsApiModel = {
      ...base,
      indicateurs: [{ id: 'IND-1', actions: ['READ'] }],
    }
    expect(canWriteIndicateur({ permissions, indicateurId: 'IND-1' })).toBe(false)
  })
})
