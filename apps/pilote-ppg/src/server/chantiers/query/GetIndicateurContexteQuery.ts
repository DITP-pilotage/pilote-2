import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type IndicateurContexteResult = {
  id: string;
  nom: string;
  description: string | null;
  uniteMesure: string | null;
  chantier: { id: string; nom: string };
  mailleNatAgregee: boolean;
  mailleRegAgregee: boolean;
};

export class GetIndicateurContexteQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(params: {
    indicateurId: string;
  }): Promise<IndicateurContexteResult | null> {
    const prisma = this.deps.prisma.getInstance();

    const indicateur = await prisma.indicateur_identite.findUnique({
      where: {
        id: params.indicateurId,
        statut: $Enums.type_statut_indicateur.PUBLIE,
      },
      include: { chantier_identite: true },
    });

    if (!indicateur) return null;

    return {
      id: indicateur.id,
      nom: indicateur.nom,
      description: indicateur.description,
      uniteMesure: indicateur.unite_mesure,
      chantier: {
        id: indicateur.chantier_identite.id,
        nom: indicateur.chantier_identite.nom,
      },
      mailleNatAgregee: indicateur.maille_nat_agregee,
      mailleRegAgregee: indicateur.maille_reg_agregee,
    };
  }
}
