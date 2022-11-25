import { PrismaClient } from '@prisma/client';
import { Chantier } from 'server/domain/chantier/chantier.interface';
import { ChantierRepository } from './chantierRepository.interface';
import { ChantierSQLRepository } from './chantierSQLRepository';

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

describe('ChantierSQLRepository', () => {
  test('Accède à une liste de chantier', async () => {
    // GIVEN
    const prisma = new PrismaClient();
    const chantierRepository: ChantierRepository = new ChantierSQLRepository(prisma);
    const chantierInitial: Chantier = { id: 'THD', nom: 'Chantier 1', axe: 'X', ppg: 'X', porteur: 'MEFSIN' };
    const chantierInitial2: Chantier = { id: 'TUP', nom: 'Chantier 2', axe: 'Y', ppg: 'Y', porteur: 'BOUBOU' };
    await chantierRepository.add(chantierInitial);
    await chantierRepository.add(chantierInitial2);

    // WHEN
    const chantiers = await chantierRepository.getListeChantiers();

    // THEN
    expect(chantiers).toEqual([chantierInitial, chantierInitial2]);
  });
});
