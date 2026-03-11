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
      select: {
        territoire_code: true,
        territoire_nom: true,
        code_insee: true,
        maille: true,
        meteo: true,
        est_applicable: true,
        derniere_maj_date_qualitative: true,
      },
    });

    return rows.map((row) => ({
      territoireCode: row.territoire_code,
      territoireNom: row.territoire_nom ?? "",
      codeInsee: row.code_insee,
      maille: row.maille,
      meteo: row.meteo ?? "NON_RENSEIGNEE",
      estApplicable: row.est_applicable,
      dateDeMajQualitative:
        row.derniere_maj_date_qualitative?.toISOString() ?? null,
    }));
  }
}
