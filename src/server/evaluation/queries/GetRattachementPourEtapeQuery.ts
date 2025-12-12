import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type RattachementPourEtape = {
  code: string;
  libelle: string;
};

export class GetRattachementPourEtapeQuery {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async run(params: {
    utilisateurId: string;
    etape: $Enums.etape_evaluation_enum;
  }): Promise<RattachementPourEtape[]> {
    return this.dependencies.prisma
      .getInstance()
      .referentiel_rattachement.findMany({
        where: {
          rattachement_utilisateur_etape_jalon: {
            some: {
              utilisateur_id: params.utilisateurId,
              etape: params.etape,
            },
          },
        },
        select: {
          code: true,
          libelle: true,
        },
      });
  }
}
