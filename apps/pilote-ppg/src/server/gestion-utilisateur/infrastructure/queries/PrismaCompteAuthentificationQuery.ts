import { CompteAuthentification } from "@/server/gestion-utilisateur/domain/StatutCompte";
import type { Inject } from "@/server/gestion-utilisateur/module";

export class PrismaCompteAuthentificationQuery {
  constructor(private readonly dependencies: Inject<"prisma">) {}

  async recuperer({
    email,
  }: {
    email: string;
  }): Promise<CompteAuthentification> {
    const prisma = this.dependencies.prisma.getInstance();

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!utilisateur) {
      return { statut: "inconnu", profilCode: null };
    }

    return {
      statut: utilisateur.date_desactivation === null ? "actif" : "desactive",
      profilCode: utilisateur.profilCode,
    };
  }
}
