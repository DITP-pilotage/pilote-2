import { territoire as PrismaTerritoire } from "@prisma/client";
import { TerritoireDTO } from "@/server/gestion-utilisateur/infrastructure/queries/PrismaUtilisateursQuery";

export const mapTerritoiresToDTO = (
  territoires: (PrismaTerritoire & {
    territoire_enfant: Pick<PrismaTerritoire, "code" | "nom" | "maille">[];
  })[],
): TerritoireDTO[] =>
  territoires.map((territoire) => ({
    code: territoire.code,
    nom: territoire.nom,
    maille: territoire.maille as "DEPT" | "REG" | "NAT",
    enfants: territoire.territoire_enfant.map((enfant) => ({
      code: enfant.code,
      nom: enfant.nom,
      maille: enfant.maille as "DEPT" | "REG" | "NAT",
      enfants: [],
    })),
  }));
