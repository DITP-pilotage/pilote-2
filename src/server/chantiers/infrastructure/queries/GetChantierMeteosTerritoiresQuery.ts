import { Inject } from "@/server/chantiers/module";
import { Meteo } from "@/server/domain/météo/Météo.interface";
import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";

export type MeteoTerritoireViewModel = {
  territoireCode: string;
  codeInsee: string;
  maille: MailleTerritoireSelectionne;
  meteo: Meteo;
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
        maille: { in: ["NAT", "REG", "DEPT"] },
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
      codeInsee: row.code_insee,
      maille: row.maille as MailleTerritoireSelectionne,
      meteo: (row.meteo as Meteo) ?? "NON_RENSEIGNEE",
      estApplicable: row.est_applicable,
      dateDeMajQualitative:
        row.derniere_maj_date_qualitative?.toISOString() ?? null,
    }));
  }
}
