import { ProfilAPI } from '@/server/authentification/domain/ProfilAPI';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { PrismaProfilRepository } from '@/server/authentification/infrastructure/adapters/PrismaProfilRepository';

describe('PrismaProfilRepository', () => {
  let prismaProfilRepository: PrismaProfilRepository;

  beforeEach(() => {
    prismaProfilRepository = new PrismaProfilRepository(prisma);
  });

  describe('#estAutoriseAAccederAuxChantiersBrouillons', () => {
    it("quand le profil n'est pas autorisé, doit remonter false", async () => {
      // Given
      const profilCodeChantierBrouillonNonAutorise: ProfilAPI = 'COORDINATEUR_DEPARTEMENT';
      
      // When
      const result = await prismaProfilRepository.estAutoriseAAccederAuxChantiersBrouillons({ profilCode: profilCodeChantierBrouillonNonAutorise });

      // Then
      expect(result).toEqual(false);
    });

    it('quand le profil est autorisé, doit remonter true', async () => {
      // Given
      const profilCodeChantierBrouillonNonAutorise: ProfilAPI = 'EQUIPE_DIR_PROJET';

      // When
      const result = await prismaProfilRepository.estAutoriseAAccederAuxChantiersBrouillons({ profilCode: profilCodeChantierBrouillonNonAutorise });

      // Then
      expect(result).toEqual(true);
    });
  });
});
