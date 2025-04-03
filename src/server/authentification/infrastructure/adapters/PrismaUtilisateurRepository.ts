import { PrismaClient } from '@prisma/client';
import { UtilisateurRepository } from '@/server/authentification/domain/ports/UtilisateurRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';

type Dependencies = {
  prisma: PrismaPilote;
};

export class PrismaUtilisateurRepository implements UtilisateurRepository {
  private prisma: PrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async estPresent({ email }: { email: string }): Promise<boolean> {
    const utilisateur = await this.prisma.utilisateur.findUnique({ where: { email } });
    return !!utilisateur;
  }
}
