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
            orderBy: { code: "asc" },
          },
        },
        orderBy: { code: "asc" },
      });

      if (territoires.length === 0) continue;

      const territoiresDTO = mapTerritoiresToDTO(territoires);
      const territoiresDedupes = this.dedupliquerTerritoires(territoiresDTO);

      utilisateursDTO.push({
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        profilCode: utilisateur.profilCode,
        territoires: territoiresDedupes,
      });
    }

    return utilisateursDTO;
  }

  private extraireTousLesTerritoires(
    habilitations: { territoires: string[] }[],
  ): string[] {
    return habilitations.flatMap((h) => h.territoires);
  }

  private dedupliquerTerritoires(
    territoires: TerritoireDTO[],
  ): TerritoireDTO[] {
    const childCodes = new Set<string>();
    for (const territoire of territoires) {
      for (const enfant of territoire.enfants) {
        childCodes.add(enfant.code);
      }
    }

    return territoires.filter((territoire) => !childCodes.has(territoire.code));
  }
}
