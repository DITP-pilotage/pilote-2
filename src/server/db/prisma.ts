import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (!global.__db) {
  global.__db = new PrismaClient();
  global.__db.$connect();
}
prisma = global.__db;

export { prisma };
