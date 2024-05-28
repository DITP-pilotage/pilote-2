import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  PrismaTokenAPIInformationRepository,
} from '@/server/authentification/infrastructure/adapters/PrismaTokenAPIInformationRepository';

describe('PrismaTokenAPIInformationRepository', () => {
  let prismaTokenAPIInformationRepository: PrismaTokenAPIInformationRepository;

  beforeEach(() => {
    prismaTokenAPIInformationRepository = new PrismaTokenAPIInformationRepository(prisma);
  });

  describe('recupererTokenAPIInformation', () => {
    it("quand le token existe, doit récupérer les informations du token associé à l'email", async () => {
      // Given
      const email = 'test@example.com';
      await prisma.token_api_information.create({
        data: {
          email: 'test@example.com',
          date_creation: new Date().toISOString(),
        },
      });
      // When
      const result = await prismaTokenAPIInformationRepository.recupererTokenAPIInformation({ email });
      // Then
      expect(result?.email).toEqual('test@example.com');
    });
    it("quand le token n'existe pas, doit retourner null", async () => {
      // Given
      const email = 'test@example.com';
      // When
      const result = await prismaTokenAPIInformationRepository.recupererTokenAPIInformation({ email });
      // Then
      expect(result).toEqual(null);
    });
  });

  describe('supprimerTokenAPIInformation', () => {
    it("quand le token existe, doit supprimer les informations du token associé à l'email", async () => {
      // Given
      const email = 'test@example.com';
      await prisma.token_api_information.create({
        data: {
          email: 'test@example.com',
          date_creation: new Date().toISOString(),
        },
      });
      // When
      await prismaTokenAPIInformationRepository.supprimerTokenAPIInformation({ email });
      // Then
      const result = await prisma.token_api_information.findUnique({
        where: {
          email: 'test@example.com',
        },
      });
      expect(result).toEqual(null);
    });
  });

  describe('listerTokenAPIInformation', () => {
    it("quand le token existe, doit récupérer les informations du token associé à l'email trié par date création", async () => {
      // Given
      await prisma.token_api_information.create({
        data: {
          email: 'test1@example.com',
          date_creation: new Date('2024/12/04').toISOString(),
        },
      });
      await prisma.token_api_information.create({
        data: {
          email: 'test2@example.com',
          date_creation: new Date('2024/11/04').toISOString(),
        },
      });
      // When
      const result = await prismaTokenAPIInformationRepository.listerTokenAPIInformation();
      // Then
      expect(result).toHaveLength(2);
      expect(result.at(0)?.email).toEqual('test2@example.com');
      expect(result.at(1)?.email).toEqual('test1@example.com');
    });
  });

  describe('sauvegarderTokenAPIInformation', () => {
    it('doit créer le token api', async () => {
      // Given
      const email = 'test@example.com';
      // When
      await prismaTokenAPIInformationRepository.sauvegarderTokenAPIInformation({ email, dateCreation: new Date().toISOString() });
      // Then
      const result = await prisma.token_api_information.findUnique({
        where: {
          email: 'test@example.com',
        },
      });
      expect(result?.email).toEqual('test@example.com');
    });
  });
});
