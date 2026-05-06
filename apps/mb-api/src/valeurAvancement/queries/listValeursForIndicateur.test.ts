import { describe, expect, it } from 'vitest'

import { fixtures } from '@/test/fixtures'
import { integrationTest } from '@/test/integrationTest'
import { listValeursForIndicateur } from '@/valeurAvancement/queries/listValeursForIndicateur'

describe.concurrent('listValeursForIndicateur', () => {
  it(
    'retourne la série temporelle pour un seul individu',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'Test' })
      await fixtures.individu({ publicId: 'Dept-84', nom: 'Vaucluse' })
      await fixtures.valeurAvancement(
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2024-01-01',
          valeur: '7.500000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2024-06-01',
          valeur: '7.800000',
        },
      )

      const result = await listValeursForIndicateur('IND-001', { individus: ['Dept-84'] })

      const value = result._unsafeUnwrap()
      expect(value.items).toEqual([
        {
          indicateur: 'IND-001',
          individu: 'Dept-84',
          dateObservation: '2024-01-01',
          valeur: 7.5,
        },
        {
          indicateur: 'IND-001',
          individu: 'Dept-84',
          dateObservation: '2024-06-01',
          valeur: 7.8,
        },
      ])
    }),
  )

  it(
    'retourne le batch multi-individus',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.individu(
        { publicId: 'Dept-84', nom: 'Vaucluse' },
        { publicId: 'Dept-13', nom: 'Bouches-du-Rhône' },
        { publicId: 'Dept-06', nom: 'Alpes-Maritimes' },
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
          individuPublicId: 'Dept-13',
          dateObservation: '2024-01-01',
          valeur: '2.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-06',
          dateObservation: '2024-01-01',
          valeur: '3.000000',
        },
      )

      const result = await listValeursForIndicateur('IND-001', {
        individus: ['Dept-84', 'Dept-13'],
      })

      const value = result._unsafeUnwrap()
      const individus = value.items.map((v) => v.individu).sort()
      expect(individus).toEqual(['Dept-13', 'Dept-84'])
      expect(value.items.find((v) => v.individu === 'Dept-06')).toBeUndefined()
    }),
  )

  it(
    'filtre par dateDebut et dateFin (inclusifs)',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.individu({ publicId: 'Dept-84', nom: 'Vaucluse' })
      await fixtures.valeurAvancement(
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2023-12-31',
          valeur: '1.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2024-01-01',
          valeur: '2.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2024-06-30',
          valeur: '3.000000',
        },
        {
          indicateurPublicId: 'IND-001',
          individuPublicId: 'Dept-84',
          dateObservation: '2024-07-01',
          valeur: '4.000000',
        },
      )

      const result = await listValeursForIndicateur('IND-001', {
        individus: ['Dept-84'],
        dateDebut: '2024-01-01',
        dateFin: '2024-06-30',
      })

      const value = result._unsafeUnwrap()
      expect(value.items.map((v) => v.dateObservation)).toEqual(['2024-01-01', '2024-06-30'])
    }),
  )

  it(
    'retourne une liste vide pour un individu sans observation',
    integrationTest(async () => {
      await fixtures.indicateur({ publicId: 'IND-001', nom: 'T' })
      await fixtures.individu({ publicId: 'Dept-84', nom: 'Vaucluse' })

      const result = await listValeursForIndicateur('IND-001', { individus: ['Dept-84'] })

      const value = result._unsafeUnwrap()
      expect(value.items).toEqual([])
    }),
  )

  it(
    'rejette quand l\'indicateur est introuvable',
    integrationTest(async () => {
      await expect(
        listValeursForIndicateur('IND-inconnu', { individus: ['Dept-84'] }),
      ).rejects.toThrow()
    }),
  )
})
