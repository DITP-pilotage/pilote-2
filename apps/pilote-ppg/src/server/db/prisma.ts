import { PrismaClient } from "@prisma/client";

import { creerAdapter } from "@/server/db/adapter";

let prisma: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (!global.__db) {
  global.__db = new PrismaClient({ adapter: creerAdapter() });
  global.__db.$connect();
}
prisma = global.__db;

export { prisma };
