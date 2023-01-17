import {
  extraitLesAvancementsGlobauxDépartementaux, moyennesParCodeInsee,
  sélectionneLesChantiersDesPérimètres,
} from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import chantierFixture from '@/fixtures/ChantierFixture';
import { DonnéesTerritoireBuilder } from '@/server/infrastructure/test/domainBuilder/DonnéesTerritoiresBuilder';

function asPérimètreIds(ns: number[]) {
  return ns.map((id: number) => 'PER-' + id.toString().padStart(3, '0'));
}

function asGroupedPérimètreIds(idGroups: number[][]) {
  return idGroups.map((group: number[]) => {
    return {
      périmètreIds: asPérimètreIds(group),
    };
  });
}

describe('Expérimentation', () => {
  describe('Sélection des chantiers en fonction des périmètres', () => {
    it('sélectionner des chantiers en fonction de périmètres', () => {
    // GIVEN
      const chantiers = chantierFixture.générerPlusieurs(3, asGroupedPérimètreIds([[1], [1, 2], [3]]));
      // WHEN
      const result = sélectionneLesChantiersDesPérimètres(chantiers, ['PER-001', 'PER-002']);
      // THEN
      expect(result).toStrictEqual([chantiers[0], chantiers[1]]);
    });

    it('sélectionne tous les chantiers quand la liste de périmètres est vide', () => {
    // GIVEN
      const chantiers = chantierFixture.générerPlusieurs(3, asGroupedPérimètreIds([[1], [1, 2], [3]]));
      // WHEN
      const result = sélectionneLesChantiersDesPérimètres(chantiers, []);
      // THEN
      expect(result).toStrictEqual([chantiers[0], chantiers[1], chantiers[2]]);
    });
  });

  describe('Extraction des avancements', () => {
    it('extrait les avancements', () => {
    // GIVEN
      const chantiers = chantierFixture.générerPlusieurs(3);
      chantiers[0].mailles.départementale = new DonnéesTerritoireBuilder()
        .withAvancementGlobal('01', 1.1)
        .build();
      chantiers[1].mailles.départementale = new DonnéesTerritoireBuilder()
        .withAvancementGlobal('01', 1.2)
        .withAvancementGlobal('02', 2.2)
        .build();
      chantiers[2].mailles.départementale = new DonnéesTerritoireBuilder()
        .withAvancementGlobal('03', 3.3)
        .build();
      // WHEN
      const result = extraitLesAvancementsGlobauxDépartementaux(chantiers);
      // THEN
      expect(result).toStrictEqual({ '01': [1.1, 1.2], '02': [2.2], '03': [3.3] });
    });
  });

  describe('Calcul des moyennes', () => {
    it('calcule les moyennes', () => {
    // GIVEN
      const valeursParCodeInsee = { '01': [1, 2, 3], '02': [], '03': [3] };
      // WHEN
      const result = moyennesParCodeInsee(valeursParCodeInsee);
      // THEN
      expect(result).toStrictEqual({ '01': 2, '02': null, '03': 3 });
    });
  });
});
