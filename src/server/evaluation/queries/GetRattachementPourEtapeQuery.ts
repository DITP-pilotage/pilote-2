import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/evaluation/module";

export type RattachementPourEtape = {
  code: string;
  libelle: string;
};

export class GetRattachementPourEtapeQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(params: {
    utilisateurId: string;
    etape: $Enums.etape_evaluation_enum;
  }): Promise<RattachementPourEtape[]> {
    return this.prisma.getInstance().referentiel_rattachement.findMany({
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
