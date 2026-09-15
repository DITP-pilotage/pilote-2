import { prisma } from "@/server/db/prisma";

/**
 * L'isolation entre tests d'integration est assuree par `createIntegrationTest`,
 * qui joue chaque test dans une transaction annulee a la fin. Rien n'est commit,
 * il n'y a donc rien a nettoyer entre deux tests.
 *
 * Ce fichier ne garde que ce qui doit vivre en dehors des transactions : les
 * donnees de reference et la fermeture du pool.
 */

beforeAll(async () => {
  await prisma.$executeRawUnsafe(
    "INSERT INTO scope VALUES ('responsabilite', 'Responsabilité') ON CONFLICT DO NOTHING;",
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
