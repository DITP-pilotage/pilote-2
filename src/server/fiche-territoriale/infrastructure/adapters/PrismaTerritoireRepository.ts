import { PrismaClient, territoire as TerritoireModel } from '@prisma/client';
import { TerritoireRepository } from '@/server/fiche-territoriale/domain/ports/TerritoireRepository';
import { Territoire } from '@/server/fiche-territoriale/domain/Territoire';

const convertirEnTerritoire = (territoireModel: TerritoireModel): Territoire => {
  return Territoire.creerTerritoire({ nomAffiché: territoireModel.nom_affiche, maille: territoireModel.maille, codeInsee: territoireModel.code_insee });
};

export class PrismaTerritoireRepository implements TerritoireRepository {
  constructor(private prismaClient: PrismaClient) {}

  async recupererTerritoireParCode({ territoireCode }: { territoireCode: string }): Promise<Territoire> {
    const territoireModel = await this.prismaClient.territoire.findUnique({
      where: {
        code: territoireCode,
      },
    });

    if (!territoireModel) {
      throw new Error("Le territoire n'existe pas");
    }

    return convertirEnTerritoire(territoireModel);
  }
}
