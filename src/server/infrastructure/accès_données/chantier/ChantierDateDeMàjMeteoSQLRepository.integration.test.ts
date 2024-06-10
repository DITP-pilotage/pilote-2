import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDatesDeMàjRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import ChantierDatesDeMàjSQLRepository from './ChantierDateDeMàjMeteoSQLRepository';

describe('ChantierDatesDeMàjSQLRepository', () => {

  describe('récupérerDatesDeMiseÀJour', () => {

    test('retourne les dernières dates météos des chantiers et territoires demandés', async () => {
      // Given
      const chantiersId = ['CH-001', 'CH-002'];
      const territoiresCode = ['DEPT-34', 'REG-84'];
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

      const synthèses = [
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('34')
          .avecDateMétéo(new Date('2023-12-31'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('34')
          .avecDateMétéo(new Date('2021-01-31'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-001')
          .avecMaille('REG')
          .avecCodeInsee('84')
          .avecDateMétéo(new Date('2022-12-31'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-002')
          .avecMaille('DEPT')
          .avecCodeInsee('34')
          .avecDateMétéo(new Date('2024-05-06'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-002')
          .avecMaille('REG')
          .avecCodeInsee('84')
          .avecDateMétéo(new Date('2022-01-01'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-002')
          .avecMaille('REG')
          .avecCodeInsee('84')
          .avecDateMétéo(new Date('2022-03-03'))
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthèses });

      // When
      const result = await repository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      const resultatAttendu = {
        'CH-001': {
          'DEPT-34': new Date('2023-12-31').toISOString(),
          'REG-84': new Date('2022-12-31').toISOString(),
        },
        'CH-002': {
          'DEPT-34': new Date('2024-05-06').toISOString(),
          'REG-84': new Date('2022-03-03').toISOString(),
        },
      };
      expect(result).toStrictEqual(resultatAttendu);
    });

    test('ne retourne pas de date météo pour un chantier sans synthèse de résultat', async () => {
      // Given
      const chantiersId = ['CH-001', 'CH-002'];
      const territoiresCode = ['DEPT-34'];
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

      const synthèses = [
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('34')
          .avecDateMétéo(new Date('2023-12-31'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('34')
          .avecDateMétéo(new Date('2021-01-31'))
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthèses });

      // When
      const result = await repository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      expect(result).toStrictEqual({
        'CH-001': {
          'DEPT-34': new Date('2023-12-31').toISOString(),
        },
      });

    });

    test('ne retourne pas de date météo pour un territoire sans synthèse de résultat', async () => {
      // Given
      const chantiersId = ['CH-001'];
      const territoiresCode = ['DEPT-34', 'REG-84'];
      const repository: ChantierDatesDeMàjRepository = new ChantierDatesDeMàjSQLRepository(prisma);

      const synthèses = [
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('34')
          .avecDateMétéo(new Date('2023-12-31'))
          .build(),
        new SyntheseDesResultatsRowBuilder()
          .avecChantierId('CH-001')
          .avecMaille('DEPT')
          .avecCodeInsee('34')
          .avecDateMétéo(new Date('2021-01-31'))
          .build(),
      ];

      await prisma.synthese_des_resultats.createMany({ data: synthèses });

      // When
      const result = await repository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      expect(result).toStrictEqual({
        'CH-001': {
          'DEPT-34': new Date('2023-12-31').toISOString(),
        },
      });
    });
  });
});
