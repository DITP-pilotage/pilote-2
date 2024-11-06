import { PrismaClient } from '@prisma/client';
import { configuration } from '@/config';


let prisma: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

if (configuration.env === 'production') {
  prisma = new PrismaClient();
  prisma.$connect();
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
    global.__db.$connect();
  }
  prisma = global.__db;
}

export { prisma };
