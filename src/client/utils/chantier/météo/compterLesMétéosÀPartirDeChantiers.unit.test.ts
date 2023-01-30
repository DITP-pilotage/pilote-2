/* eslint-disable sonarjs/no-duplicate-string */
import compterLesMétéosÀPartirDeChantiers from '@/client/utils/chantier/météo/compterLesMétéosÀPartirDeChantiers';
import ChantierFixture from '@/fixtures/ChantierFixture';
import Météo from '@/server/domain/chantier/Météo.interface';
import { Maille, Territoire } from '@/server/domain/chantier/Chantier.interface';
import { agrégerDonnéesTerritoires } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';

function générerChantierAvecMaille(maille: Maille, valeurMaille: Record<string, Territoire>) {
  return ChantierFixture.générer({
    mailles: {
      nationale: {},
      régionale: {},
      départementale: {},
      [maille]: valeurMaille,
    },
  });
}

function générerTerritoireAvecMétéo(codeInsee: string, météo: Météo) {
  return {
    codeInsee,
    météo,
    avancement: { global: null, annuel: null },
  };
}

describe('compterLesMétéosÀPartirDeChantiers', () => {
  test('retourne le nombre de météos à la maille nationale', () => {
    // GIVEN
    const chantiers = [
      générerChantierAvecMaille('nationale', { 'FR': générerTerritoireAvecMétéo('FR', 'SOLEIL') }),
      générerChantierAvecMaille('nationale', { 'FR': générerTerritoireAvecMétéo('FR', 'SOLEIL') }),
      générerChantierAvecMaille('nationale', { 'FR': générerTerritoireAvecMétéo('FR', 'NUAGE') }),
      générerChantierAvecMaille('nationale', { 'FR': générerTerritoireAvecMétéo('FR', 'COUVERT') }),
      générerChantierAvecMaille('nationale', { 'FR': générerTerritoireAvecMétéo('FR', 'COUVERT') }),
      générerChantierAvecMaille('nationale', { 'FR': générerTerritoireAvecMétéo('FR', 'COUVERT') }),
    ];
    const donnéesTerritoiresAgrégées = agrégerDonnéesTerritoires(chantiers.map(chantier => chantier.mailles));

    // WHEN
    const résultat = compterLesMétéosÀPartirDeChantiers(donnéesTerritoiresAgrégées);

    // THEN
    const attendu = {
      'NON_RENSEIGNEE': 0,
      'ORAGE': 0,
      'COUVERT': 3,
      'NUAGE': 1,
      'SOLEIL': 2,
      'NON_NECESSAIRE': 0,
    };
    expect(résultat.nationale.FR).toStrictEqual(attendu);
  });

  test('retourne le nombre de météos à la maille départementale, pour chaque département', () => {
    // GIVEN
    const chantiers = [
      générerChantierAvecMaille('départementale', {
        '2B': générerTerritoireAvecMétéo('2B', 'SOLEIL'),
        '21': générerTerritoireAvecMétéo('21', 'ORAGE'),
      }),
      générerChantierAvecMaille('départementale', {
        '2B': générerTerritoireAvecMétéo('2B', 'NON_RENSEIGNEE'),
        '21': générerTerritoireAvecMétéo('21', 'COUVERT'),
      }),
      générerChantierAvecMaille('départementale', {
        '2B': générerTerritoireAvecMétéo('2B', 'NON_NECESSAIRE'),
        '21': générerTerritoireAvecMétéo('21', 'COUVERT'),
      }),
    ];
    const donnéesTerritoiresAgrégées = agrégerDonnéesTerritoires(chantiers.map(chantier => chantier.mailles));

    // WHEN
    const résultat = compterLesMétéosÀPartirDeChantiers(donnéesTerritoiresAgrégées);

    // THEN
    const attenduDept2B = {
      'NON_RENSEIGNEE': 1,
      'ORAGE': 0,
      'COUVERT': 0,
      'NUAGE': 0,
      'SOLEIL': 1,
      'NON_NECESSAIRE': 1,
    };
    const attenduDept21 = {
      'NON_RENSEIGNEE': 0,
      'ORAGE': 1,
      'COUVERT': 2,
      'NUAGE': 0,
      'SOLEIL': 0,
      'NON_NECESSAIRE': 0,
    };
    expect(résultat.départementale['2B']).toStrictEqual(attenduDept2B);
    expect(résultat.départementale['21']).toStrictEqual(attenduDept21);
  });

  test('compte comme "NON_RENSEIGNEE" une météo attendue dans un territoire qui est manquant dans un chantier', () => {
    // GIVEN
    const chantiers = [
      générerChantierAvecMaille('départementale', {
        '2B': générerTerritoireAvecMétéo('2B', 'SOLEIL'),
        '21': générerTerritoireAvecMétéo('21', 'ORAGE'),
      }),
      générerChantierAvecMaille('départementale', {
        '2B': générerTerritoireAvecMétéo('2B', 'SOLEIL'),
      }),
    ];
    const donnéesTerritoiresAgrégées = agrégerDonnéesTerritoires(chantiers.map(chantier => chantier.mailles));

    // WHEN
    const résultat = compterLesMétéosÀPartirDeChantiers(donnéesTerritoiresAgrégées);

    // THEN
    expect(résultat.départementale['21'].NON_RENSEIGNEE).toEqual(1);
  });
});
