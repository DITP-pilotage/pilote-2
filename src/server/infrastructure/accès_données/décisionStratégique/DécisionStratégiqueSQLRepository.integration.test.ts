import { Prisma } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import DécisionStratégiqueSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/DécisionStratégiqueSQLRow.builder';
import DécisionStratégiqueRepository from '@/server/domain/décisionStratégique/DécisionStratégiqueRepository.interface';
import DécisionStratégiqueSQLRepository from './DécisionStratégiqueSQLRepository';

describe('DécisionStratégiqueSQLRepository', () => {
  const chantierId = 'CH-001';
  const décisionStratégiqueRepository: DécisionStratégiqueRepository = new DécisionStratégiqueSQLRepository(prisma);

  describe('récupérerLePlusRécent', () => {
    it('Retourne la décision stratégique la plus récente pour un chantier avec son contenu, auteur et date', async () => {
      // GIVEN
      const décisionStratégiqueLaPlusRécente = new DécisionStratégiqueSQLRowBuilder()
        .avecChantierId(chantierId)
        .avecDate(new Date('2023-03-30'))
        .build();
        
      const décisionStratégiqueMoinsRécente = new DécisionStratégiqueSQLRowBuilder()
        .avecChantierId(chantierId)
        .avecDate(new Date('2023-01-30'))
        .build();

      const décisionsStratégiques: Prisma.decision_strategiqueCreateArgs['data'][] = [décisionStratégiqueMoinsRécente, décisionStratégiqueLaPlusRécente];

      // WHEN
      await prisma.decision_strategique.createMany({ data: décisionsStratégiques });
      const résultat = await décisionStratégiqueRepository.récupérerLePlusRécent(chantierId);

      // THEN
      expect(résultat).toStrictEqual({
        id: décisionStratégiqueLaPlusRécente.id,
        type: décisionStratégiqueLaPlusRécente.type,
        auteur: décisionStratégiqueLaPlusRécente.auteur,
        contenu: décisionStratégiqueLaPlusRécente.contenu,
        date: (décisionStratégiqueLaPlusRécente.date as Date).toISOString(),
      });
    });
  });

  describe('créer', () => {
    // GIVEN
    const id = '123';
    const contenu = 'Décision importante';
    const type = 'suivi_des_decisions';
    const date = new Date('2023-04-14');
    const auteur = 'Jean DUPONT';

    it('Crée la décision stratégique en base', async () => {

      // WHEN
      await décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur, date);

      // THEN
      const décisionStratégiqueCrééeEnBase = await prisma.decision_strategique.findUnique({ where: { id: id } });
      expect(décisionStratégiqueCrééeEnBase?.id).toEqual(id);
    });

    it('Retourne la décision stratégique créée', async () => {
      // When
      const décisionStratégiqueCrééeRetournéeParLeRepo = await décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur, date);

      // Then
      expect(décisionStratégiqueCrééeRetournéeParLeRepo).toStrictEqual({
        id,
        type,
        contenu,
        auteur,
        date: date.toISOString(),
      });
    });
  });
});
