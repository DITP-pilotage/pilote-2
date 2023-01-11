import { PrismaClient } from '@prisma/client';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import PérimètreMinistérielSQLRepository from './PérimètreMinistérielSQLRepository';

describe('PérimètreMinistérielSQLRepository', () => {
  test('Accède à une liste de périmètres ministériels', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const repository: PérimètreMinistérielRepository = new PérimètreMinistérielSQLRepository(prisma);
    const périmètre1: PérimètreMinistériel = { id: 'PER-001', nom: 'Périmètre 1' };
    const périmètre2: PérimètreMinistériel = { id: 'PER-002', nom: 'Périmètre 2' };
    await prisma.perimetre.createMany({ data: [périmètre1, périmètre2] });

    // WHEN
    const périmètres = await repository.getListe();

    // THEN
    expect(périmètres).toEqual([périmètre1, périmètre2]);
  });
});
