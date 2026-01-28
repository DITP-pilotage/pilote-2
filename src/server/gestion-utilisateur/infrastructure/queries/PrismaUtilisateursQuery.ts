import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type TerritoireDTO = {
  code: string;
  nom: string;
  maille: "DEPT" | "REG" | "NAT";
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
          },
        },
      });

      if (territoires.length === 0) continue;

      const territoiresFlat: TerritoireDTO[] = territoires.flatMap((t) => [
        {
          code: t.code,
          nom: t.nom,
          maille: this.mapMaille(t.maille),
        },
        ...t.territoire_enfant.map((enfant) => ({
          code: enfant.code,
          nom: enfant.nom,
          maille: this.mapMaille(enfant.maille),
        })),
      ]);

      utilisateursDTO.push({
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        profilCode: utilisateur.profilCode,
        territoires: territoiresFlat,
      });
    }

    return utilisateursDTO;
  }

  private extraireTousLesTerritoires(
    habilitations: { territoires: string[] }[],
  ): string[] {
    return habilitations.flatMap((h) => h.territoires);
  }

  private mapMaille(maille: $Enums.Maille): "DEPT" | "REG" | "NAT" {
    switch (maille) {
      case "DEPT":
        return "DEPT";
      case "REG":
        return "REG";
      case "NAT":
        return "NAT";
    }
  }
}
