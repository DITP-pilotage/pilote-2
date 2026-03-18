import { Inject } from "@/server/chantiers/module";

export type MeteoTerritoireViewModel = {
  territoireCode: string;
  territoireNom: string;
  codeInsee: string;
  maille: string;
  meteo: string;
  estApplicable: boolean | null;
  dateDeMajQualitative: string | null;
};

export class GetChantierMeteosTerritoiresQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierId: string;
    jalon: number;
  }): Promise<MeteoTerritoireViewModel[]> {
    const prisma = this.deps.prisma.getInstance();

    const rows = await prisma.chantier_territoire.findMany({
      where: {
        id: params.chantierId,
        maille: { in: ["REG", "DEPT"] },
        chantier_territoire_jalon: {
          some: { jalon: params.jalon },
        },
      },
      include: {
        territoire: true,
      },
    });

    return rows.map((row) => ({
      territoireCode: row.territoire.code,
      territoireNom: row.territoire.nom_affiche,
      codeInsee: row.code_insee,
      maille: row.maille,
      meteo: row.meteo ?? "NON_RENSEIGNEE",
      estApplicable: row.est_applicable,
      dateDeMajQualitative:
        row.derniere_maj_date_qualitative?.toISOString() ?? null,
    }));
  }
}
