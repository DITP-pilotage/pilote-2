import { type Dashboard, type DashboardWidget } from '@pilote/kpilote-shared/assistant/dashboard'
import { describe, expect, it } from 'vitest'

import { type DashboardContext } from '@/assistant/tools/dashboard/context'
import { validateDashboard } from '@/assistant/tools/dashboard/validate'

const context: DashboardContext = {
  indicateurs: [
    { id: 'IND-1', nom: 'Chômage', referentielIds: ['REF-DEPT', 'REF-ACAD'] },
    { id: 'IND-2', nom: 'Équipement 100 % Santé', referentielIds: ['REF-REG'] },
  ],
  collections: [{ id: 'COL-1', nom: 'Emploi', indicateurIds: ['IND-1'] }],
  individus: [
    { id: 'DEPT-59', nom: 'Nord', referentielId: 'REF-DEPT' },
    { id: 'DEPT-62', nom: 'Pas-de-Calais', referentielId: 'REF-DEPT' },
    { id: 'REG-32', nom: 'Hauts-de-France', referentielId: 'REF-REG' },
  ],
  referentiels: [
    { id: 'REF-DEPT', nom: 'Départements', carte: true },
    { id: 'REF-ACAD', nom: 'Académies', carte: false },
    { id: 'REF-REG', nom: 'Régions', carte: true },
  ],
}

const dashboardOf = (...widgets: DashboardWidget[]): Dashboard => ({
  titre: 'Emploi',
  containers: [{ widgets }],
})

const check =
  (...widgets: DashboardWidget[]) =>
  () =>
    validateDashboard(dashboardOf(...widgets), context)

describe('validateDashboard', () => {
  it('accepte un dashboard dont tous les identifiants viennent du contexte', () => {
    expect(
      check(
        { type: 'kpi_indicateur', indicateurId: 'IND-1', individuId: 'DEPT-59' },
        { type: 'tableau_individus', indicateurId: 'IND-1', individuIds: ['DEPT-59', 'DEPT-62'] },
        { type: 'kpi_collection', collectionId: 'COL-1', individuId: 'DEPT-62' },
        { type: 'carte_indicateur', indicateurId: 'IND-1', referentielId: 'REF-DEPT' },
        { type: 'titre_section', titre: 'Situation en 2026' },
      ),
    ).not.toThrow()
  })

  it('refuse un identifiant inventé', () => {
    expect(check({ type: 'kpi_indicateur', indicateurId: 'IND-9', individuId: 'DEPT-59' })).toThrow(
      'IND-9',
    )
    expect(
      check({ type: 'evolution_indicateur', indicateurId: 'IND-1', individuIds: ['DEPT-01'] }),
    ).toThrow('DEPT-01')
    expect(
      check({ type: 'contributions_collection', collectionId: 'COL-9', individuId: 'DEPT-59' }),
    ).toThrow('COL-9')
  })

  it('refuse un référentiel qui n’est pas celui de l’indicateur', () => {
    expect(
      check({ type: 'valeurs_remarquables', indicateurId: 'IND-1', referentielId: 'REF-REG' }),
    ).toThrow('REF-REG')
  })

  it('refuse une carte sur un référentiel qui n’en a pas', () => {
    expect(
      check({ type: 'carte_indicateur', indicateurId: 'IND-1', referentielId: 'REF-ACAD' }),
    ).toThrow('carte')
  })

  it('refuse un chiffre dans un titre ou un paragraphe', () => {
    expect(check({ type: 'titre_section', titre: 'Le Nord à 12 %' })).toThrow('chiffre')
    expect(check({ type: 'paragraph', contenu: ['En retard de 3 points.'] })).toThrow('chiffre')
    expect(
      check({ type: 'titre_section', titre: 'Emploi', description: 'Écart de 4,5 pts' }),
    ).toThrow('chiffre')
  })

  it('accepte un nom d’entité qui contient un chiffre, et une année', () => {
    expect(
      check(
        { type: 'titre_section', titre: 'Équipement 100 % Santé (IND-2) en 2026' },
        { type: 'kpi_indicateur', indicateurId: 'IND-2', individuId: 'REG-32' },
      ),
    ).not.toThrow()
  })

  it('refuse toute valeur écrite en texte, même sans unité', () => {
    expect(check({ type: 'paragraph', contenu: ['45 000 chômeurs dans le Nord.'] })).toThrow(
      'chiffre',
    )
    expect(check({ type: 'titre_section', titre: 'Taux de 45' })).toThrow('chiffre')
  })

  it('refuse un individu d’un référentiel où l’indicateur n’a pas de valeurs', () => {
    expect(check({ type: 'kpi_indicateur', indicateurId: 'IND-1', individuId: 'REG-32' })).toThrow(
      'REG-32',
    )
    expect(
      check({ type: 'evolution_indicateur', indicateurId: 'IND-2', individuIds: ['DEPT-59'] }),
    ).toThrow('DEPT-59')
  })

  it('refuse un individu répété dans un même widget', () => {
    expect(
      check({
        type: 'tableau_individus',
        indicateurId: 'IND-1',
        individuIds: ['DEPT-59', 'DEPT-59'],
      }),
    ).toThrow('répété')
  })
})
