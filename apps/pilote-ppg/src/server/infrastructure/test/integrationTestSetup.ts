import { prisma } from "@/server/db/prisma";

/**
 * Liste des tables a vider entre deux tests, calculee une fois par fichier.
 *
 * Le catalogue ne bouge pas pendant un run : la redecouvrir avant chaque test
 * coutait deux requetes sur `pg_tables` par test, soit pres de 1900 allers-retours
 * sur la suite complete.
 */
let tablesAVider: { public: string; rawData: string } | null = null;

/** Donnees de reference, recreees par le seed et jamais videes. */
const TABLES_PRESERVEES = [
  "_prisma_migrations",
  "territoire",
  "profil",
  "profil_habilitation",
  "habilitation_scope",
  "scope",
];

const listerLesTablesAVider = async () => {
  const [tablesPublic, tablesRawData] = await Promise.all([
    prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
    prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname = 'raw_data'`,
  ]);

  return {
    public: tablesPublic
      .map(({ tablename }) => tablename)
      .filter((nom) => !TABLES_PRESERVEES.includes(nom))
      .map((nom) => `"public"."${nom}"`)
      .join(", "),
    rawData: tablesRawData
      .map(({ tablename }) => `"raw_data"."${tablename}"`)
      .join(", "),
  };
};

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    "INSERT INTO scope VALUES ('responsabilite', 'Responsabilité') ON CONFLICT DO NOTHING;",
  );
  tablesAVider ??= await listerLesTablesAVider();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  if (!tablesAVider)
    throw new Error("Les tables a vider n'ont pas ete listees.");

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablesAVider.public} CASCADE;`,
  );
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tablesAVider.rawData} CASCADE;`,
  );
});
