import { PrismaClient } from '@prisma/client';
import { DatabaseSeeder } from './DatabaseSeeder';

const prisma = new PrismaClient();

new DatabaseSeeder(prisma)
  .seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    throw new Error(`Erreur durant le seed de la base de données ${error}`);
  });
