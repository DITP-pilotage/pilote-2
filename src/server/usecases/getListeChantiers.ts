import { PrismaClient } from '@prisma/client';
import { ChantierSQLRepository } from '@/server/infrastructure/chantierSQLRepository';

export default async function getListeChantiers() {
  const prisma = new PrismaClient();
  const chantiersRepository = new ChantierSQLRepository(prisma);
  return chantiersRepository.getListeChantiers();
}
