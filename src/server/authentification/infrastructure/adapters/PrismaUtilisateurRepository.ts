import { PrismaClient } from '@prisma/client';
import { UtilisateurRepository } from '@/server/authentification/domain/ports/UtilisateurRepository';

export class PrismaUtilisateurRepository implements UtilisateurRepository {
  constructor(private prismaClient: PrismaClient) {}

  async estPresent({ email }: { email: string }): Promise<boolean> {
    const utilisateur = await this.prismaClient.utilisateur.findUnique({ where: { email } });
    return !!utilisateur;
  }
}
