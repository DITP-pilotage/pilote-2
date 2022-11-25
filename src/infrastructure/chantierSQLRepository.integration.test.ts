import { PrismaClient } from '@prisma/client';
import { Chantier, ChantierRepository, ChantierSQLRepository } from './chantierSQLRepository';

beforeEach(async () => {
  const prisma = new PrismaClient();
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>> `SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log({ error });
  }
});

describe('ChanterSQLRepository', () => {
  test('Accède aux chantiers persévérants', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantierInitial: Chantier = { id: 'THD', nom: 'Chantier 1', axe: 'X', ppg: 'X', porteur: 'MEFSIN' };
    await chantierRepository.add(chantierInitial);
    // WHEN
    const chantier = await chantierRepository.getById('THD');
    // THEN
    expect(chantier.porteur).toBe('MEFSIN');
  });
});
