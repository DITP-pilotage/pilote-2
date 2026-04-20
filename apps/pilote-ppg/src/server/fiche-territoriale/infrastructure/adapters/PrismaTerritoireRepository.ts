import { territoire as TerritoireModel } from "@prisma/client";
import { TerritoireRepository } from "@/server/fiche-territoriale/domain/ports/TerritoireRepository";
import { Territoire } from "@/server/fiche-territoriale/domain/Territoire";
import { prisma } from "@/server/db/prisma";
import { NotFoundError } from "@/server/app/error-boundary/not-found-error";

const convertirEnTerritoire = (
  territoireModel: TerritoireModel,
): Territoire => {
  return Territoire.creerTerritoire({
    nomAffiché: territoireModel.nom_affiche,
    maille: territoireModel.maille,
    codeInsee: territoireModel.code_insee,
  });
};

export class PrismaTerritoireRepository implements TerritoireRepository {
  async recupererTerritoireParCode({
    territoireCode,
  }: {
    territoireCode: string;
  }): Promise<Territoire> {
    const territoireModel = await prisma.territoire.findUnique({
      where: {
        code: territoireCode,
      },
    });

    if (!territoireModel) {
      throw new NotFoundError("Le territoire n'existe pas");
    }

    return convertirEnTerritoire(territoireModel);
  }
}
