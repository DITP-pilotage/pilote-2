import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { PrismaMinistereRepository } from '@/server/fiche-territoriale/infrastructure/adapters/PrismaMinistereRepository';

describe('PrismaMinistereRepository', () => {
  let prismaMinistereRepository: PrismaMinistereRepository;

  beforeEach(() => {
    prismaMinistereRepository = new PrismaMinistereRepository(prisma);
  });

  describe('#recupererMapMinistereParListeCodeMinistere', () => {
    it('doit récupérer les ministères associés aux codes', async () => {
      // Given
      const listeCodeMinistere = ['1009', '10'];
      await prisma.ministere.create({
        data: {
          id: '1009',
          icone: 'remix::football::fill',
          acronyme: 'MEAE',
          nom: 'Europe et Affaires Étrangères',
        },
      });
      await prisma.ministere.create({
        data: {
          id: '10',
          icone: 'remix::basket::fill',
          acronyme: 'MTPEI',
          nom: 'Travail, Plein emploi et Insertion',
        },
      });
      await prisma.ministere.create({
        data: {
          id: '1001',
          icone: 'remix::seedling::fill',
          acronyme: 'MASA',
          nom: 'Agriculture et Souveraineté alimentaire',
        },
      });

      // When
      const result = await prismaMinistereRepository.recupererMapMinistereParListeCodeMinistere({ listeCodeMinistere });

      // Then
      expect([...result.keys()]).toEqual(['1009', '10']);
      expect(result.get('1009')?.icone).toEqual('remix::football::fill');
      expect(result.get('10')?.icone).toEqual('remix::basket::fill');
    });
  });
});
