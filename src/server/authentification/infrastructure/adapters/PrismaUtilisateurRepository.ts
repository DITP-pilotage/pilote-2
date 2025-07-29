import { UtilisateurRepository } from "@/server/authentification/domain/ports/UtilisateurRepository";
import { prisma } from "@/server/db/prisma";

export class PrismaUtilisateurRepository implements UtilisateurRepository {
  async estPresent({ email }: { email: string }): Promise<boolean> {
    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
    });
    return !!utilisateur;
  }
}
