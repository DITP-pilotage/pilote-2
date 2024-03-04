import {
  PrismaTerritoireRepository,
} from '@/server/fiche-territoriale/infrastructure/adapters/PrismaTerritoireRepository';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';

describe('PrismaTerritoireRepository', () => {
  let prismaTerritoireRepository: PrismaTerritoireRepository;

  beforeEach(() => {
    prismaTerritoireRepository = new PrismaTerritoireRepository(prisma);
  });

  describe('#recupererTerritoireParCode', () => {
    test("quand il n'existe pas de territoire associé au code, doit remonter une erreur", async () => {
      // Given
      const territoireCode = 'UN-CODE';
      expect.assertions(2);

      // When
      try {
        await prismaTerritoireRepository.recupererTerritoireParCode({ territoireCode });
      } catch (error) {
        // Then
        expect(error).toBeDefined();
        expect((error as Error).message).toStrictEqual("Le territoire n'existe pas");
      }
    });
    test('quand territoire associé au code existe, doit récupérer le territoire associé au code', async () => {
      // Given
      const territoireCode = 'DEPT-34';

      // When
      const result = await prismaTerritoireRepository.recupererTerritoireParCode({ territoireCode });

      // Then
      expect(result.nomAffiché).toStrictEqual('34 - Hérault');
      expect(result.codeInsee).toStrictEqual('34');
    });
  });
});
