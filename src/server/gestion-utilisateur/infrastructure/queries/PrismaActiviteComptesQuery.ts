import { PrismaPilote } from "@/server/db/PrismaPilote";
import { mapTerritoiresToDTO } from "@/server/gestion-utilisateur/infrastructure/utils/territoires";

export type TerritoireDTO = {
  code: string;
  nom: string;
  maille: "DEPT" | "REG" | "NAT";
  enfants: TerritoireDTO[];
};

export type CompteDTO = {
  email: string;
  nom: string;
  prenom: string;
  profil: string;
  territoires: TerritoireDTO[];
};

export type EvenementCompteDTO =
  | { type: "COMPTE_CREE"; compte: CompteDTO; date: Date }
  | { type: "COMPTE_DESACTIVE"; compte: CompteDTO; date: Date };

export class PrismaActiviteComptesQuery {
  constructor(
    private readonly dependencies: {
      prisma: PrismaPilote;
    },
  ) {}

  async recupererActiviteComptes(params: {
    dateDebut: Date;
    dateFin: Date;
    profilCodes: string[];
  }): Promise<EvenementCompteDTO[]> {
    const evenements: EvenementCompteDTO[] = [];
    const prisma = this.dependencies.prisma.getInstance();

    const comptesCrees = await prisma.utilisateur.findMany({
      where: {
        date_creation: { gte: params.dateDebut, lte: params.dateFin },
        profilCode: { in: params.profilCodes },
      },
      include: {
        habilitation: {
          select: {
            territoires: true,
          },
        },
      },
    });

    for (const utilisateur of comptesCrees) {
      const territoires = await this.recupererTousLesTerritoires(
        utilisateur.habilitation,
      );

      evenements.push({
        type: "COMPTE_CREE",
        compte: this.mapToCompteDTO(utilisateur, territoires),
        date: utilisateur.date_creation,
      });
    }

    const comptesDesactives = await prisma.utilisateur.findMany({
      where: {
        date_desactivation: { gte: params.dateDebut, lte: params.dateFin },
        profilCode: { in: params.profilCodes },
      },
      include: {
        habilitation: {
          select: {
            territoires: true,
          },
        },
      },
    });

    for (const utilisateur of comptesDesactives) {
      const territoires = await this.recupererTousLesTerritoires(
        utilisateur.habilitation,
      );

      evenements.push({
        type: "COMPTE_DESACTIVE",
        compte: this.mapToCompteDTO(utilisateur, territoires),
        date: utilisateur.date_desactivation!,
      });
    }

    return evenements.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private async recupererTousLesTerritoires(
    habilitations: { territoires: string[] }[],
  ): Promise<TerritoireDTO[]> {
    const tousLesCodes = new Set<string>();
    for (const habilitation of habilitations) {
      for (const code of habilitation.territoires) {
        tousLesCodes.add(code);
      }
    }

    if (tousLesCodes.size === 0) return [];

    const territoires = await this.dependencies.prisma
      .getInstance()
      .territoire.findMany({
        where: { code: { in: Array.from(tousLesCodes) } },
        include: {
          territoire_enfant: {
            select: {
              code: true,
              nom: true,
              maille: true,
            },
          },
        },
      });

    return mapTerritoiresToDTO(territoires);
  }

  private mapToCompteDTO(
    utilisateur: {
      email: string;
      nom: string;
      prenom: string;
      profilCode: string;
    },
    territoires: TerritoireDTO[],
  ): CompteDTO {
    return {
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      profil: utilisateur.profilCode,
      territoires,
    };
  }
}
