import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type TerritoireDTO = {
  code: string;
  nom: string;
  maille: "DEPT" | "REG" | "NAT";
};

export type TerritoireAvecEnfantsDTO = TerritoireDTO & {
  codesEnfants: string[];
};

export type UtilisateurDTO = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  profilCode: string;
  territoire: TerritoireAvecEnfantsDTO;
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
      const territoireCode = this.extraireTerritoirePrincipal(
        utilisateur.habilitation,
      );
      if (!territoireCode) continue;

      const territoire = await prisma.territoire.findUnique({
        where: { code: territoireCode },
        include: {
          territoire_enfant: {
            select: { code: true },
          },
        },
      });

      if (!territoire) continue;

      utilisateursDTO.push({
        id: utilisateur.id,
        email: utilisateur.email,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        profilCode: utilisateur.profilCode,
        territoire: {
          code: territoire.code,
          nom: territoire.nom,
          maille: this.mapMaille(territoire.maille),
          codesEnfants: territoire.territoire_enfant.map((t) => t.code),
        },
      });
    }

    return utilisateursDTO;
  }

  private extraireTerritoirePrincipal(
    habilitations: { territoires: string[] }[],
  ): string | undefined {
    const habilitationAvecTerritoire = habilitations.find(
      (h) => h.territoires.length > 0,
    );
    return habilitationAvecTerritoire?.territoires[0];
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
