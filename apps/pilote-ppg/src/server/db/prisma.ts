import { PrismaClient } from "@prisma/client";

import { creerAdapter } from "@/server/db/adapter";

let prisma: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

// Pas de `$connect()` ici : Prisma ouvre la connexion a la premiere requete, et
// la declencher a l'import couplait a une base tout module qui importe ce fichier,
// tests unitaires compris.
if (!global.__db) {
  global.__db = new PrismaClient({ adapter: creerAdapter() });
}
prisma = global.__db;

export { prisma };
