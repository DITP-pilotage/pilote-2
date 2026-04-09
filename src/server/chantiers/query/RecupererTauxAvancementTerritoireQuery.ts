import { $Enums } from "@prisma/client";
import { Inject } from "@/server/chantiers/module";
import { Maille } from "@/server/domain/maille/Maille.interface";

export type RecupererTauxAvancementTerritoireResult = {
  territoire_code: string;
  jalon: number;
  taux_avancement: number | null;
};

function determineMaille(territoireCode: string): Maille {
  if (territoireCode.startsWith("NAT")) return "nationale";
  if (territoireCode.startsWith("REG")) return "regionale";
  return "departementale";
}

export class RecupererTauxAvancementTerritoireQuery {
  constructor(
    private readonly deps: Inject<
      "prisma" | "agregerAvancementsChantiersUseCase"
    >,
  ) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
  }): Promise<RecupererTauxAvancementTerritoireResult> {
    const prisma = this.deps.prisma.getInstance();

    const publishedChantiers = await prisma.chantier_identite.findMany({
      where: { statut: $Enums.type_statut.PUBLIE },
      select: { id: true },
    });
    const chantierIds = publishedChantiers.map((chantier) => chantier.id);

    const { agregat } = await this.deps.agregerAvancementsChantiersUseCase.run(
      chantierIds,
      params.jalon,
    );

    const maille = determineMaille(params.territoireCode);
    const territoireData = agregat[maille]?.territoires[params.territoireCode];
    const tauxAvancement =
      territoireData?.repartition.avancements.annuel.moyenne ?? null;

    return {
      territoire_code: params.territoireCode,
      jalon: params.jalon,
      taux_avancement: tauxAvancement,
    };
  }
}
