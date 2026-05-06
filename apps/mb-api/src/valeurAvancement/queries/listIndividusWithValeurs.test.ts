import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { listIndividusWithValeurs } from '@/valeurAvancement/queries/listIndividusWithValeurs'

describe.concurrent('listIndividusWithValeurs', () => {
  it(
    'retourne les individus ayant au moins une observation avec dernière obs et nombre',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.individu(
        { publicId: 'Dept-84', nom: 'Vaucluse' },
        { publicId: 'Dept-13', nom: 'BdR' },
        { publicId: 'Dept-06', nom: 'AM' },
      )
      await fixtures.valeurAvancement(
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2024-01-01',
          valeur: '1.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2024-06-01',
          valeur: '2.500000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-13',
          dateObservation: '2024-01-01',
          valeur: '5.000000',
        },
      )

      const result = await listIndividusWithValeurs('IND-001', {})

      const value = result._unsafeUnwrap()
      const byId = new Map(value.items.map((row) => [row.individu.id, row]))
      expect([...byId.keys()].sort()).toEqual(['Dept-13', 'Dept-84'])
      expect(byId.get('Dept-84')).toMatchObject({
        derniereObservation: { dateObservation: '2024-06-01', valeur: 2.5 },
        nombreObservations: 2,
      })
      expect(byId.get('Dept-13')).toMatchObject({
        derniereObservation: { dateObservation: '2024-01-01', valeur: 5 },
        nombreObservations: 1,
      })
      expect(value.total).toBe(2)
    }),
  )

  it(
    'filtre par référentiel',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.referentiel(
        { publicId: 'REF-departements', nom: 'Dept' },
        { publicId: 'REF-regions', nom: 'Reg' },
      )
      await fixtures.individu(
        { publicId: 'Dept-84', nom: 'Vaucluse' },
        { publicId: 'Reg-93', nom: 'PACA' },
      )
      await fixtures.referentielIndividu(
        { referentielPublicId: 'REF-departements', individuPublicId: 'Dept-84' },
        { referentielPublicId: 'REF-regions', individuPublicId: 'Reg-93' },
      )
      await fixtures.valeurAvancement(
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2024-01-01',
          valeur: '1.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Reg-93',
          dateObservation: '2024-01-01',
          valeur: '2.000000',
        },
      )

      const result = await listIndividusWithValeurs('IND-001', { referentiel: 'REF-regions' })

      const value = result._unsafeUnwrap()
      expect(value.items.map((row) => row.individu.id)).toEqual(['Reg-93'])
      expect(value.total).toBe(1)
    }),
  )

  it(
    'rejette quand l\'indicateur est introuvable',
    integrationTest(async () => {
      await expect(listIndividusWithValeurs('IND-inconnu', {})).rejects.toThrow()
    }),
  )

  it(
    'rejette quand le référentiel filtré est introuvable',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })

      await expect(
        listIndividusWithValeurs('IND-001', { referentiel: 'REF-inconnu' }),
      ).rejects.toThrow()
    }),
  )
})
