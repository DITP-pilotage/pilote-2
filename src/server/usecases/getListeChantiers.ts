import { PrismaClient } from '@prisma/client';
import ChantierSQLRepository from '@/server/infrastructure/ChantierSQLRepository';

export default async function getListeChantiers() {
  const prisma = new PrismaClient();
  const chantiersRepository = new ChantierSQLRepository(prisma);
  return chantiersRepository.getListe();
}
