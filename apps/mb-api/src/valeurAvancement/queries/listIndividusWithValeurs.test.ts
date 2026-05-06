import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'

describe.concurrent('listIndividusWithValeurs', () => {
  it(
    'retourne les individus ayant au moins une valeur avec dernière valeur et nombre',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.individu(
        { publicId: 'DEPT-84', nom: 'Vaucluse' },
        { publicId: 'DEPT-13', nom: 'BdR' },
        { publicId: 'DEPT-06', nom: 'AM' },
      )
      await fixtures.valeurAvancement(
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'DEPT-84',
          date: '2024-01-01',
          valeur: '1.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'DEPT-84',
          date: '2024-06-01',
          valeur: '2.500000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'DEPT-13',
          date: '2024-01-01',
          valeur: '5.000000',
        },
      )

      const result = await listIndividusWithValeurs('IND-001', {})

      const value = result._unsafeUnwrap()
      const byId = new Map(value.items.map((row) => [row.individu.id, row]))
      expect([...byId.keys()].sort()).toEqual(['DEPT-13', 'DEPT-84'])
      expect(byId.get('DEPT-84')).toMatchObject({
        derniereValeur: { date: '2024-06-01', valeur: 2.5 },
        nombreValeurs: 2,
      })
      expect(byId.get('DEPT-13')).toMatchObject({
        derniereValeur: { date: '2024-01-01', valeur: 5 },
        nombreValeurs: 1,
      })
      expect(value.total).toBe(2)
    }),
  )

  it(
    'filtre par référentiel',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.referentiel(
        { publicId: 'REF-DEPT', nom: 'Dept' },
        { publicId: 'REF-REG', nom: 'Reg' },
      )
      await fixtures.individu(
        { publicId: 'DEPT-84', nom: 'Vaucluse' },
        { publicId: 'REG-93', nom: 'PACA' },
      )
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-DEPT', individuPublicId: 'DEPT-84' },
        { referentielPublicId: 'REF-REG', individuPublicId: 'REG-93' },
      )
      await fixtures.valeurAvancement(
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'DEPT-84',
          date: '2024-01-01',
          valeur: '1.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'REG-93',
          date: '2024-01-01',
          valeur: '2.000000',
        },
      )

      const result = await listIndividusWithValeurs('IND-001', { referentiel: 'REF-REG' })

      const value = result._unsafeUnwrap()
      expect(value.items.map((row) => row.individu.id)).toEqual(['REG-93'])
      expect(value.total).toBe(1)
    }),
  )

  it(
    'rejette quand l\'indicateur est introuvable',
    integrationTest(async () => {
      await expect(listIndividusWithValeurs('IND-999', {})).rejects.toThrow()
    }),
  )

  it(
    'rejette quand le référentiel filtré est introuvable',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })

      await expect(
        listIndividusWithValeurs('IND-001', { referentiel: 'REF-INCONNU' }),
      ).rejects.toThrow()
    }),
  )
})
