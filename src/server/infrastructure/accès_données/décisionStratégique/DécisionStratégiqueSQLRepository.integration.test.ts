import { Prisma } from '@prisma/client';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import DécisionStratégiqueSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/DécisionStratégiqueSQLRow.builder';
import DécisionStratégiqueRepository from '@/server/domain/décisionStratégique/DécisionStratégiqueRepository.interface';
import DécisionStratégiqueSQLRepository from './DécisionStratégiqueSQLRepository';

describe('DécisionStratégiqueSQLRepository', () => {
  // GIVEN
  const chantierId = 'CH-001';
  const décisionStratégiqueRepository: DécisionStratégiqueRepository = new DécisionStratégiqueSQLRepository(prisma);

  const décisionStratégiqueLaPlusRécente = new DécisionStratégiqueSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecDate(new Date('2023-03-30'))
    .build();
        
  const décisionStratégiqueMoinsRécente = new DécisionStratégiqueSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecDate(new Date('2023-01-30'))
    .build();

  const décisionStratégiqueLaPlusAncienne = new DécisionStratégiqueSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecDate(new Date('2022-09-30'))
    .build();

  const décisionsStratégiques: Prisma.decision_strategiqueCreateArgs['data'][] = [décisionStratégiqueMoinsRécente, décisionStratégiqueLaPlusRécente, décisionStratégiqueLaPlusAncienne];
  
  describe('récupérerLePlusRécent', () => {
    it('Retourne la décision stratégique la plus récente pour un chantier avec son contenu, auteur et date', async () => {
      await prisma.decision_strategique.createMany({ data: décisionsStratégiques });

      // WHEN
      const résultat = await décisionStratégiqueRepository.récupérerLaPlusRécente(chantierId);

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

  describe('RécupérerLHistorique', () => {
    it("Retourne toutes les publications de décisions stratégiques pour un chantier, dans l'ordre décroissant", async () => {
      await prisma.decision_strategique.createMany({ data: décisionsStratégiques });

      // WHEN 
      const résultat = await décisionStratégiqueRepository.récupérerLHistorique(chantierId);

      // THEN
      expect(résultat[0]?.date).toStrictEqual((décisionStratégiqueLaPlusRécente.date as Date).toISOString());
      expect(résultat[1]?.date).toStrictEqual((décisionStratégiqueMoinsRécente.date as Date).toISOString());
      expect(résultat[2]?.date).toStrictEqual((décisionStratégiqueLaPlusAncienne.date as Date).toISOString());
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
