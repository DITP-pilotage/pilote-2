import ChantierDatesDeMàjRepository from '@/server/domain/chantier/ChantierDateDeMàjMeteoRepository.interface';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import SyntheseDesResultatsRowBuilder
  from '@/server/infrastructure/test/builders/sqlRow/SynthèseDesRésultatsSQLRow.builder';
import ChantierDatesDeMàjSQLRepository from './ChantierDateDeMàjMeteoSQLRepository';

describe('ChantierDatesDeMàjSQLRepository', () => {
  let chantierDateDeMàjMeteoRepository: ChantierDatesDeMàjRepository;

  beforeEach(() => {
    chantierDateDeMàjMeteoRepository = new ChantierDatesDeMàjSQLRepository(prisma);
  });

  describe('#récupérerDateDeMiseÀJourMeteo', () => {
    test('quand il existe plusieurs chantiers, doit retourner les dernières dates météos des chantiers et territoires demandés', async () => {
      // Given
      const chantiersId = ['CH-001', 'CH-002'];
      const territoiresCode = ['DEPT-34', 'REG-84'];

      const listeSynthèsesDesResultats = [
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

      await prisma.synthese_des_resultats.createMany({ data: listeSynthèsesDesResultats });

      // When
      const result = await chantierDateDeMàjMeteoRepository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      expect(result).toStrictEqual({
        'CH-001': {
          'DEPT-34': new Date('2023-12-31').toISOString(),
          'REG-84': new Date('2022-12-31').toISOString(),
        },
        'CH-002': {
          'DEPT-34': new Date('2024-05-06').toISOString(),
          'REG-84': new Date('2022-03-03').toISOString(),
        },
      });
    });

    test('quand il n\'existe pas de synthèse de résultat pour le chantier, ne doit pas retourner de date météo', async () => {
      // Given
      const chantiersId = ['CH-001', 'CH-002'];
      const territoiresCode = ['DEPT-34'];

      const listeSynthèsesDesResultats = [
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

      await prisma.synthese_des_resultats.createMany({ data: listeSynthèsesDesResultats });

      // When
      const result = await chantierDateDeMàjMeteoRepository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      expect(result).toStrictEqual({
        'CH-001': {
          'DEPT-34': new Date('2023-12-31').toISOString(),
        },
      });

    });

    test('quand il n\'existe pas de synthèse de résultat pour un territoire, ne doit pas retourner de date météo', async () => {
      // Given
      const chantiersId = ['CH-001'];
      const territoiresCode = ['DEPT-34', 'REG-84'];

      const listeSynthèsesDesResultats = [
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

      await prisma.synthese_des_resultats.createMany({ data: listeSynthèsesDesResultats });

      // When
      const result = await chantierDateDeMàjMeteoRepository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      expect(result).toStrictEqual({
        'CH-001': {
          'DEPT-34': new Date('2023-12-31').toISOString(),
        },
      });
    });

    test('quand la liste de chantier est vide, doit retourner un objet vide', async () => {
      // Given
      const chantiersId: string[] = [];
      const territoiresCode = ['DEPT-34', 'REG-84'];

      const listeSynthèsesDesResultats = [
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

      await prisma.synthese_des_resultats.createMany({ data: listeSynthèsesDesResultats });

      // When
      const result = await chantierDateDeMàjMeteoRepository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      expect(result).toStrictEqual({});
    });

    test('quand la liste des territoires est vide, doit retourner un objet vide', async () => {
      // Given
      const chantiersId = ['CH-001'];
      const territoiresCode: string[] = [];

      const listeSynthèsesDesResultats = [
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

      await prisma.synthese_des_resultats.createMany({ data: listeSynthèsesDesResultats });

      // When
      const result = await chantierDateDeMàjMeteoRepository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      expect(result).toStrictEqual({});
    });

    test('quand la liste des territoires est vide et la liste de chantier est vide, doit retourner un objet vide', async () => {
      // Given
      const chantiersId: string[] = [];
      const territoiresCode: string[] = [];

      const listeSynthèsesDesResultats = [
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

      await prisma.synthese_des_resultats.createMany({ data: listeSynthèsesDesResultats });

      // When
      const result = await chantierDateDeMàjMeteoRepository.récupérerDateDeMiseÀJourMeteo(chantiersId, territoiresCode);

      // Then
      expect(result).toStrictEqual({});
    });
  });
});
