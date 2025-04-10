import { Maille, PrismaClient } from '@prisma/client';
import { PrismaTerritoireRepository } from '@/server/chantiers/infrastructure/adapters/PrismaTerritoireRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';

describe('PrismaTerritoireRepository', () => {
  let prisma: PrismaClient;
  let prismaTerritoireRepository: PrismaTerritoireRepository;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();
    prismaTerritoireRepository = new PrismaTerritoireRepository({ prisma: prismaPilote });
  });

  it('doit récupérer la liste des codes de territoire et les codes de leurs territoires enfants', async () => {
    // Given
    await prisma.territoire.create({
      data: {
        code: '01',
        nom: 'Territoire 01',
        nom_affiche: 'Territoire 01',
        maille: Maille.REG,
        code_insee: '01',
        zone_id: '01',
      },
    });

    await prisma.territoire.create({
      data: {
        code: '0101',
        nom: 'Territoire 0101',
        nom_affiche: 'Territoire 0101',
        code_parent: '01',
        maille: Maille.DEPT,
        code_insee: '0101',
        zone_id: '0101',
      },
    });

    await prisma.territoire.create({
      data: {
        code: '010101',
        nom: 'Territoire 010101',
        nom_affiche: 'Territoire 010101',
        code_parent: '01',
        maille: Maille.DEPT,
        code_insee: '010101',
        zone_id: '010101',
      },
    });

    await prisma.territoire.create({
      data: {
        code: '02',
        nom: 'Territoire Reg 010101',
        nom_affiche: 'Territoire Reg 010101',
        maille: Maille.REG,
        code_insee: '01010101',
        zone_id: '01010101',
      },
    });

    await prisma.territoire.create({
      data: {
        code: '0202',
        nom: 'Territoire Dept 0202',
        nom_affiche: 'Territoire Dept 0202',
        maille: Maille.DEPT,
        code_insee: '0202',
        zone_id: '0202',
        code_parent: '02',
      },
    }); 

    // When
    const territoireCodes = await prismaTerritoireRepository.recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({ territoireCode: '01' });

    // Then
    expect(territoireCodes).toEqual(['01', '0101', '010101']);
  });

  it('doit lancer une erreur si le territoire n\'est pas trouvé', async () => {
    // When
    await expect(prismaTerritoireRepository.recupererTerritoireCodesEtTerritoiresCodesEnfantsParTerritoireCode({ territoireCode: '01010101' })).rejects.toThrow('Territoire non trouvé');
  });
});
