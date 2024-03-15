import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  PrismaSynthèseDesRésultatsRepository,
} from '@/server/fiche-conducteur/infrastructure/adapters/PrismaSynthèseDesRésultatsRepository';

describe('PrismaSynthèseDesRésultatsRepository', () => {
  let prismaSynthèseDesRésultatsRepository: PrismaSynthèseDesRésultatsRepository;

  describe('#recupererLaPlusRecenteMailleNatParChantierId', () => {
    beforeEach(() => {
      prismaSynthèseDesRésultatsRepository = new PrismaSynthèseDesRésultatsRepository(prisma);
    });

    it('doit récupérer la synthèse la plus récente pour un chantier de maille nationale', async () => {
      // Given
      await prisma.chantier.create({
        data: {
          id: 'CH-168',
          nom: 'Nom chantier',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
        },
      });
      await prisma.chantier.create({
        data: {
          id: 'CH-169',
          nom: 'Nom chantier',
          code_insee: 'FR',
          maille: 'NAT',
          territoire_code: 'NAT-FR',
        },
      });
      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-168',
          code_insee: 'FR',
          maille: 'NAT',
          date_commentaire: '2022-01-02T00:00:00.000Z',
          meteo: 'SOLEIL',
          commentaire: 'commentaire synthèse OK maille',
        },
      });
      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-168',
          code_insee: 'FR',
          maille: 'NAT',
          date_commentaire: '2021-01-02T00:00:00.000Z',
          meteo: 'COUVERT',
          commentaire: 'commentaire synthèse KO ancienne',
        },
      });
      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-168',
          code_insee: '34',
          maille: 'DEPT',
          meteo: 'SOLEIL',
          commentaire: 'commentaire synthèse KO maille',
        },
      });
      await prisma.synthese_des_resultats.create({
        data: {
          id: randomUUID(),
          chantier_id: 'CH-169',
          code_insee: '34',
          meteo: 'SOLEIL',
          maille: 'DEPT',
          commentaire: 'commentaire synthèse KO chantierID',
        },
      });

      // When
      const syntheseDesResultatsResult = await prismaSynthèseDesRésultatsRepository.recupererLaPlusRecenteMailleNatParChantierId('CH-168');

      // Then
      expect(syntheseDesResultatsResult?.meteo).toEqual('SOLEIL');
      expect(syntheseDesResultatsResult?.commentaire).toEqual('commentaire synthèse OK maille');
    });
  });
});
