import { PrismaPilote } from "@/server/db/PrismaPilote";
import { mapTerritoiresToDTO } from "@/server/gestion-utilisateur/infrastructure/utils/territoires";

export type TerritoireDTO = {
  code: string;
  nom: string;
  maille: "DEPT" | "REG" | "NAT";
  enfants: TerritoireDTO[];
};

export type UtilisateurDTO = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  territoires: TerritoireDTO[];
  chantiers: string[];
  perimetres: string[];
};

interface Dependencies {
  prisma: PrismaPilote;
}

export class PrismaUtilisateursQuery {
  constructor(private readonly dependencies: Dependencies) {}

  async recupererParProfils(profils: string[]): Promise<UtilisateurDTO[]> {
    const prisma = this.dependencies.prisma.getInstance();

    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        profilCode: { in: profils },
        date_desactivation: null,
      },
      include: {
        habilitation: {
          select: {
            territoires: true,
            chantiers: true,
            perimetres: true,
          },
        },
      },
    });

    const utilisateursDTO: UtilisateurDTO[] = [];

    for (const utilisateur of utilisateurs) {
      const codesTerritoires = this.extraireTousLesTerritoires(
        utilisateur.habilitation,
      );
      if (codesTerritoires.length === 0) continue;

      const territoires = await prisma.territoire.findMany({
        where: { code: { in: codesTerritoires } },
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

      if (territoires.length === 0) continue;

      utilisateursDTO.push({
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        profilCode: utilisateur.profilCode,
        territoires: mapTerritoiresToDTO(territoires),
        chantiers: this.extraireTousLesChantiers(utilisateur.habilitation),
        perimetres: this.extraireTousLesPerimetres(utilisateur.habilitation),
      });
    }

    return utilisateursDTO;
  }

  private extraireTousLesTerritoires(
    habilitations: { territoires: string[] }[],
  ): string[] {
    return habilitations.flatMap((h) => h.territoires);
  }

  private extraireTousLesChantiers(
    habilitations: { chantiers: string[] }[],
  ): string[] {
    return habilitations.flatMap((h) => h.chantiers);
  }

  private extraireTousLesPerimetres(
    habilitations: { perimetres: string[] }[],
  ): string[] {
    return habilitations.flatMap((h) => h.perimetres);
  }
}
