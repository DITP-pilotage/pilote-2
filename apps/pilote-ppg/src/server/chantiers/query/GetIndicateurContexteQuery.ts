import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { expliquerConstructionValeurAffichee } from "@/server/chantiers/domain/expliquerConstructionValeurAffichee";

export type IndicateurContexteResult = {
  id: string;
  nom: string;
  description: string | null;
  uniteMesure: string | null;
  chantier: { id: string; nom: string };
  mailleNatAgregee: boolean;
  mailleRegAgregee: boolean;
  explicationValeurAffichee: string | null;
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
        chantier_identite: { statut: $Enums.type_statut.PUBLIE },
      },
      include: { chantier_identite: true },
    });

    if (!indicateur) return null;

    const parametrage =
      await prisma.metadata_parametrage_indicateurs.findUnique({
        where: { indic_id: params.indicateurId },
        select: {
          param_vaca_decumul_from: true,
          param_vaca_partition_date: true,
          param_vaca_op: true,
        },
      });

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
      explicationValeurAffichee: expliquerConstructionValeurAffichee(
        parametrage && {
          decumulFrom: parametrage.param_vaca_decumul_from,
          partitionDate: parametrage.param_vaca_partition_date,
          operation: parametrage.param_vaca_op,
        },
      ),
    };
  }
}
