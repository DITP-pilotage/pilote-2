import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  PrismaSyntheseDesResultatsRepository,
} from '@/server/fiche-territoriale/infrastructure/adapters/PrismaSyntheseDesResultatsRepository';

describe('PrismaSyntheseDesResultatsRepository', () => {
  let prismaSyntheseDesResultatsRepository: PrismaSyntheseDesResultatsRepository;

  beforeEach(() => {
    prismaSyntheseDesResultatsRepository = new PrismaSyntheseDesResultatsRepository(prisma);
  });

  describe('#recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire', () => {
    it('doit récupérer les synthèses correspondant à la liste des chantiers id', async () => {
      // Given
      const listeChantierId = ['CH-001', 'CH-002'];
      const maille = 'DEPT';
      const codeInsee = '34';

      await prisma.chantier.create({
        data: {
          id: 'CH-001',
          nom: 'Un nom de chantier 1',
          code_insee: '04',
          maille: 'DEPT',
          meteo: null,
          territoire_code: 'DEPT-34',
          taux_avancement: 2,
        },
      });
      await prisma.chantier.create({
        data: {
          id: 'CH-002',
          nom: 'Un nom de chantier 2',
          code_insee: '04',
          maille: 'DEPT',
          meteo: null,
          territoire_code: 'DEPT-35',
          taux_avancement: 2,
        },
      });

      await prisma.chantier.create({
        data: {
          id: 'CH-003',
          nom: 'Un nom de chantier 3',
          code_insee: '04',
          maille: 'DEPT',
          meteo: null,
          territoire_code: 'DEPT-36',
          taux_avancement: 2,
        },
      });

      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-001',
          code_insee: '34',
          maille: 'DEPT',
          date_meteo: '2023-02-02T00:00:00.000Z',
          date_commentaire: '2024-01-02T00:00:00.000Z',
        },
      });
      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-001',
          code_insee: '34',
          maille: 'DEPT',
          date_meteo: '2021-01-02T00:00:00.000Z',
          date_commentaire: '2022-01-02T00:00:00.000Z',
        },
      });

      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-002',
          code_insee: '34',
          maille: 'DEPT',
          date_meteo: '2020-03-02T00:00:00.000Z',
          date_commentaire: '2021-04-02T00:00:00.000Z',
        },
      });
      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-002',
          code_insee: '35',
          maille: 'DEPT',
          date_meteo: '2021-01-02T00:00:00.000Z',
          date_commentaire: '2022-01-02T00:00:00.000Z',
        },
      });
      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-002',
          code_insee: '34',
          maille: 'REG',
          date_meteo: '2021-01-02T00:00:00.000Z',
          date_commentaire: '2022-01-02T00:00:00.000Z',
        },
      });


      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-003',
          code_insee: '34',
          maille: 'DEPT',
          date_meteo: '2021-01-02T00:00:00.000Z',
          date_commentaire: '2022-01-02T00:00:00.000Z',
        },
      });

      // When
      const result = await prismaSyntheseDesResultatsRepository.recupererMapSyntheseDesResultatsParListeChantierIdEtTerritoire({ listeChantierId, maille, codeInsee });

      // Then
      expect([...result.keys()]).toStrictEqual(['CH-001', 'CH-002']);
      expect(result.get('CH-001')?.at(0)?.dateMeteo).toEqual('2023-02-02T00:00:00.000Z');
      expect(result.get('CH-001')?.at(0)?.dateCommentaire).toEqual('2024-01-02T00:00:00.000Z');
      expect(result.get('CH-001')?.at(1)?.dateMeteo).toEqual('2021-01-02T00:00:00.000Z');
      expect(result.get('CH-001')?.at(1)?.dateCommentaire).toEqual('2022-01-02T00:00:00.000Z');

      expect(result.get('CH-002')?.at(0)?.dateMeteo).toEqual('2020-03-02T00:00:00.000Z');
      expect(result.get('CH-002')?.at(0)?.dateCommentaire).toEqual('2021-04-02T00:00:00.000Z');
    });
  });
});
