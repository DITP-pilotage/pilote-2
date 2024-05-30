import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { PrismaUtilisateurRepository } from '@/server/authentification/infrastructure/PrismaUtilisateurRepository';

describe('PrismaUtilisateurRepository', () => {
  let prismaUtilisateurRepository: PrismaUtilisateurRepository;

  beforeEach(() => {
    prismaUtilisateurRepository = new PrismaUtilisateurRepository(prisma);
  });

  describe('#estPresent', () => {
    it("doit remonter true si l'email appartient à un utilisateur", async () => {
      // Given
      await prisma.utilisateur.create({
        data: {
          email: 'john.doe@test.com',
          nom: 'John',
          prenom: 'Doe',
          auteur_modification: 'test',
          date_creation: new Date().toISOString(),
          auteur_creation: 'test',
          profil: {
            connect: {
              code: 'DITP_ADMIN',
            },
          },
        },
      });
      // When
      const estPresent = await prismaUtilisateurRepository.estPresent({ email: 'john.doe@test.com' });
      // Then
      expect(estPresent).toEqual(true);
    });
    it("doit remonter false si l'email appartient à aucun utilisateur", async () => {
      await prisma.utilisateur.create({
        data: {
          email: 'jane.doe@test.com',
          nom: 'Jane',
          prenom: 'Doe',
          auteur_modification: 'test',
          date_creation: new Date().toISOString(),
          auteur_creation: 'test',
          profil: {
            connect: {
              code: 'DITP_ADMIN',
            },
          },
        },
      });
      // When
      const estPresent = await prismaUtilisateurRepository.estPresent({ email: 'john.doe@test.com' });
      // Then
      expect(estPresent).toEqual(false);
    });
  });
});
