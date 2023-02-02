import { perimetre, PrismaClient } from '@prisma/client';
import PérimètreMinistérielRepository
  from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import PérimètreMinistérielSQLRepository from './PérimètreMinistérielSQLRepository';

describe('PérimètreMinistérielSQLRepository', () => {
  test('Accède à une liste de périmètres ministériels', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: PérimètreMinistérielRepository = new PérimètreMinistérielSQLRepository(prisma);
    const périmètre1: perimetre = { id: 'PER-001', nom: 'Périmètre 1', ministere: 'Justice' };
    const périmètre2: perimetre = { id: 'PER-002', nom: 'Périmètre 2', ministere: 'Justice' };
    await prisma.perimetre.createMany({ data: [périmètre1, périmètre2] });

    // WHEN
    const périmètres = await repository.getListe();

    // THEN
    expect(périmètres).toStrictEqual([{ id: 'PER-001', nom: 'Périmètre 1' }, { id: 'PER-002', nom: 'Périmètre 2' }]);
  });
});
