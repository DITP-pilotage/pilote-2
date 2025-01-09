import { decision_strategique } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import DécisionStratégiqueSQLRowBuilder from '@/server/infrastructure/test/builders/sqlRow/DécisionStratégiqueSQLRow.builder';
import DécisionStratégiqueRepository from '@/server/domain/chantier/décisionStratégique/DécisionStratégiqueRepository.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import DécisionStratégiqueSQLRepository, { NOMS_TYPES_DÉCISION_STRATÉGIQUE } from './DécisionStratégiqueSQLRepository';

describe('DécisionStratégiqueSQLRepository', () => {
  // GIVEN
  const chantierId = 'CH-001';
  const auteur_id = randomUUID();
  const décisionStratégiqueRepository: DécisionStratégiqueRepository = new DécisionStratégiqueSQLRepository(prisma);

  const décisionStratégiqueLaPlusRécente = new DécisionStratégiqueSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecAuteurId(auteur_id)
    .avecDate(new Date('2023-03-30'))
    .build();
        
  const décisionStratégiqueMoinsRécente = new DécisionStratégiqueSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecAuteurId(auteur_id)
    .avecDate(new Date('2023-01-30'))
    .build();

  const décisionStratégiqueLaPlusAncienne = new DécisionStratégiqueSQLRowBuilder()
    .avecChantierId(chantierId)
    .avecAuteurId(auteur_id)
    .avecDate(new Date('2022-09-30'))
    .build();

  const décisionStratégiqueAvecAuteurId = new DécisionStratégiqueSQLRowBuilder()
    .avecChantierId('CH-004')
    .avecAuteurId(auteur_id)
    .avecDate(new Date('2022-09-30'))
    .build();

  const décisionsStratégiques: decision_strategique[] = [décisionStratégiqueMoinsRécente, décisionStratégiqueLaPlusRécente, décisionStratégiqueLaPlusAncienne];
  
  describe('récupérerLePlusRécent', () => {
    it('Retourne la décision stratégique la plus récente pour un chantier avec son contenu, auteur et date', async () => {
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'John',
          prenom: 'Doe',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });
      await prisma.decision_strategique.createMany({ data: décisionsStratégiques });

      // WHEN
      const résultat = await décisionStratégiqueRepository.récupérerLaPlusRécente(chantierId);

      // THEN
      expect(résultat).toStrictEqual({
        id: décisionStratégiqueLaPlusRécente.id,
        type: NOMS_TYPES_DÉCISION_STRATÉGIQUE[décisionStratégiqueLaPlusRécente.type],
        auteur: 'Doe John',
        contenu: décisionStratégiqueLaPlusRécente.contenu,
        date: (décisionStratégiqueLaPlusRécente.date).toISOString(),
      });
    });
    it('Lorsque l\'auteur id est non null, retourne prenom + nom de l\'utilisateur associé', async () => {
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Marveaux',
          prenom: 'Sylvain',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });
      await prisma.decision_strategique.create({ data: décisionStratégiqueAvecAuteurId });

      // WHEN
      const résultat = await décisionStratégiqueRepository.récupérerLaPlusRécente('CH-004');

      // THEN
      expect(résultat).toStrictEqual({
        id: décisionStratégiqueAvecAuteurId.id,
        type: NOMS_TYPES_DÉCISION_STRATÉGIQUE[décisionStratégiqueAvecAuteurId.type],
        auteur: 'Sylvain Marveaux',
        contenu: décisionStratégiqueAvecAuteurId.contenu,
        date: (décisionStratégiqueAvecAuteurId.date).toISOString(),
      });
    });
  });

  describe('RécupérerLHistorique', () => {
    it("Retourne toutes les publications de décisions stratégiques pour un chantier, dans l'ordre décroissant", async () => {
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Marveaux',
          prenom: 'Sylvain',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });
      
      await prisma.decision_strategique.createMany({ data: décisionsStratégiques });

      // WHEN 
      const résultat = await décisionStratégiqueRepository.récupérerHistorique(chantierId);

      // THEN
      expect(résultat[0]?.date).toStrictEqual((décisionStratégiqueLaPlusRécente.date).toISOString());
      expect(résultat[1]?.date).toStrictEqual((décisionStratégiqueMoinsRécente.date).toISOString());
      expect(résultat[2]?.date).toStrictEqual((décisionStratégiqueLaPlusAncienne.date).toISOString());
    });
  });

  describe('créer', () => {
    // GIVEN
    const id = '123';
    const contenu = 'Décision importante';
    const type = 'suiviDesDécisionsStratégiques';
    const date = new Date('2023-04-14');

    it('Crée la décision stratégique en base', async () => {
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'John',
          prenom: 'Doe',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      // WHEN
      await décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur_id, date);

      // THEN
      const décisionStratégiqueCrééeEnBase = await prisma.decision_strategique.findUnique({ where: { id: id } });
      expect(décisionStratégiqueCrééeEnBase?.id).toEqual(id);
    });

    it('Retourne la décision stratégique créée', async () => {
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: 'john.doe@test.com',
          nom: 'Z',
          prenom: 'Jay',
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      // When
      const décisionStratégiqueCrééeRetournéeParLeRepo = await décisionStratégiqueRepository.créer(chantierId, id, contenu, type, auteur_id, date);

      // Then
      expect(décisionStratégiqueCrééeRetournéeParLeRepo).toStrictEqual({
        id,
        type,
        contenu,
        auteur: 'Jay Z',
        date: date.toISOString(),
      });
    });
  });
});
