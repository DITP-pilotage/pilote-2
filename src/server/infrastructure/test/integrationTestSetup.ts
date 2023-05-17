import { PrismaClient } from '@prisma/client';

// export const prisma = new PrismaClient({ log: ['query'] });
export const prisma = new PrismaClient();

beforeEach(async () => {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename
                                                                          FROM pg_tables
                                                                          WHERE schemaname = 'public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => ['_prisma_migrations', 'territoire', 'profil', 'profil_habilitation', 'habilitation_scope', 'scope'].includes(name) === false)
    .map((name) => `"public"."${name}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  await prisma.mesure_indicateur.deleteMany();
});

