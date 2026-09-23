import { StatutCompte } from "@/server/gestion-utilisateur/domain/StatutCompte";
import type { Inject } from "@/server/gestion-utilisateur/module";

export class PrismaStatutCompteQuery {
  constructor(private readonly dependencies: Inject<"prisma">) {}

  async recuperer({ email }: { email: string }): Promise<StatutCompte> {
    const prisma = this.dependencies.prisma.getInstance();

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!utilisateur) {
      return "inconnu";
    }

    return utilisateur.date_desactivation === null ? "actif" : "desactive";
  }
}
