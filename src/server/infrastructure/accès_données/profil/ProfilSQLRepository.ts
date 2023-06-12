import { PrismaClient } from '@prisma/client';
import ProfilRepository from '@/server/domain/profil/ProfilRepository';

export default class ProfilSQLRepository implements ProfilRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  récupérerTous(): Promise<Profil[]> {
    return this.prisma.profil.findMany();
  }
}
