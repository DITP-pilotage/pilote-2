import { PrismaPilote } from "@/server/db/PrismaPilote";
import { UtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/UtilisateurRepository";

export class PrismaUtilisateurRepository implements UtilisateurRepository {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async recupererUtilisateursParProfilEtTerritoire(args: {
    profil: string;
    territoireCode: string;
  }): Promise<string[]> {
    const utilisateurs = await this.prisma.getInstance().utilisateur.findMany({
      where: {
        profilCode: args.profil,
        date_desactivation: null,
        habilitation: {
          some: {
            scopeCode: "lecture",
            territoires: {
              has: args.territoireCode,
            },
          },
        },
      },
      select: {
        email: true,
      },
    });

    return utilisateurs.map((utilisateur) => utilisateur.email);
  }

  async recupererEmailsParUtilisateurIds(
    utilisateurIds: string[],
  ): Promise<string[]> {
    const utilisateurs = await this.prisma.getInstance().utilisateur.findMany({
      where: {
        id: {
          in: utilisateurIds,
        },
        date_desactivation: null,
      },
      select: {
        email: true,
      },
    });

    return utilisateurs.map((utilisateur) => utilisateur.email);
  }
}
