import type { Inject } from "@/server/chantiers/module";

export type IndicateurDemande = {
  id: string;
  chantierId: string;
  estApplicable: boolean;
};

export class VerifierIndicateursDemandesQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    indicateurIds: string[];
    territoireCodes: string[];
  }): Promise<IndicateurDemande[]> {
    const indicateurs = await this.deps.prisma
      .getInstance()
      .indicateur_identite.findMany({
        where: {
          id: { in: params.indicateurIds },
          statut: "PUBLIE",
          chantier_identite: { statut: "PUBLIE" },
        },
        select: {
          id: true,
          chantier_id: true,
          _count: {
            select: {
              indicateur_territoire: {
                where: {
                  territoire_code: { in: params.territoireCodes },
                  est_applicable: true,
                },
              },
            },
          },
        },
        orderBy: { id: "asc" },
      });

    return indicateurs.map((indicateur) => ({
      id: indicateur.id,
      chantierId: indicateur.chantier_id,
      estApplicable: indicateur._count.indicateur_territoire > 0,
    }));
  }
}
