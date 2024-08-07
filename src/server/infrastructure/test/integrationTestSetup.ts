import { PrismaClient } from '@prisma/client';
import logger from '@/server/infrastructure/Logger';

export const prisma = new PrismaClient();

beforeEach(async () => {
  try {
    await prisma.$executeRawUnsafe("INSERT INTO scope VALUES ('responsabilite', 'Responsabilité');");
  } catch {
    logger.info('Le scope responsabilité existe déjà');
  }

  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`SELECT tablename
                                                                          FROM pg_tables
                                                                          WHERE schemaname = 'public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => !['_prisma_migrations', 'territoire', 'profil', 'profil_habilitation', 'habilitation_scope', 'scope'].includes(name))
    .map((name) => `"public"."${name}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  await prisma.mesure_indicateur.deleteMany();
});

