import keyBy from "lodash.keyby";
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

    const allCodes = utilisateurs.flatMap((utilisateur) =>
      this.extraireTousLesTerritoires(utilisateur.habilitation),
    );

    if (allCodes.length === 0) return [];

    const allTerritoires = await prisma.territoire.findMany({
      where: { code: { in: allCodes } },
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

    const territoiresByCode = keyBy(allTerritoires, "code");

    return utilisateurs
      .map((utilisateur) => {
        const codes = this.extraireTousLesTerritoires(utilisateur.habilitation);
        if (codes.length === 0) return null;

        const territoires = codes
          .map((code) => territoiresByCode[code])
          .filter((territoire) => territoire != null);

        if (territoires.length === 0) return null;

        const territoiresDTO = mapTerritoiresToDTO(territoires);
        const territoiresDedupes = this.dedupliquerTerritoires(territoiresDTO);

        return {
          id: utilisateur.id,
          email: utilisateur.email,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          profilCode: utilisateur.profilCode,
          territoires: territoiresDedupes,
        };
      })
      .filter(
        (utilisateur): utilisateur is UtilisateurDTO => utilisateur != null,
      );
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
