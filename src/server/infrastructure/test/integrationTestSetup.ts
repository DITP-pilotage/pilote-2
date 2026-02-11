import logger from "@/server/infrastructure/Logger";
import { prisma } from "@/server/db/prisma";

beforeEach(async () => {
  try {
    await prisma.$executeRawUnsafe(
      "INSERT INTO scope VALUES ('responsabilite', 'Responsabilité') ON CONFLICT DO NOTHING;",
    );
  } catch {
    logger.info("Le scope responsabilité existe déjà");
  }

  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename 
    FROM pg_tables
    WHERE schemaname = 'public'`;
  const tablenamesRawData = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'raw_data'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter(
      (name) =>
        ![
          "_prisma_migrations",
          "territoire",
          "profil",
          "profil_habilitation",
          "habilitation_scope",
          "scope",
        ].includes(name),
    )
    .map((name) => `"public"."${name}"`)
    .join(", ");

  const tablesRawData = tablenamesRawData
    .map(({ tablename }) => tablename)
    .map((name) => `"raw_data"."${name}"`)
    .join(", ");

  await prisma.$transaction([
    prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`),
    prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tablesRawData} CASCADE;`),
    prisma.mesure_indicateur.deleteMany(),
  ]);
});
