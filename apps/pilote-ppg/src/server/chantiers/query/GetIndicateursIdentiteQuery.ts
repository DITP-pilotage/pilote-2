import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";

export type IndicateurIdentiteResult = {
  id: string;
  nom: string;
  description: string | null;
  type_id: $Enums.TypeIndicateur;
  est_phare: boolean;
  chantier: {
    id: string;
    nom: string;
  };
};

export type GetIndicateursIdentiteParams = {
  chantierIds?: string[];
};

export class GetIndicateursIdentiteQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(
    params: GetIndicateursIdentiteParams = {},
  ): Promise<IndicateurIdentiteResult[]> {
    const prisma = this.deps.prisma.getInstance();

    const indicateurs = await prisma.indicateur_identite.findMany({
      where: {
        statut: $Enums.type_statut_indicateur.PUBLIE,
        chantier_identite: { statut: $Enums.type_statut.PUBLIE },
        ...(params.chantierIds !== undefined
          ? { chantier_id: { in: params.chantierIds } }
          : {}),
      },
      include: { chantier_identite: true },
      orderBy: [{ chantier_id: "asc" }, { id: "asc" }],
    });

    return indicateurs.map((indicateur) => ({
      id: indicateur.id,
      nom: indicateur.nom,
      description: indicateur.description,
      type_id: indicateur.type_id,
      est_phare: indicateur.est_phare ?? false,
      chantier: {
        id: indicateur.chantier_identite.id,
        nom: indicateur.chantier_identite.nom,
      },
    }));
  }
}
