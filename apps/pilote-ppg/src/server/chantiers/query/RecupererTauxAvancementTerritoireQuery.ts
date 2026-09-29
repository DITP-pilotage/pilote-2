import { $Enums } from "@prisma/client";
import { Inject } from "@/server/chantiers/module";
import { determineMaille } from "@/server/domain/maille/determineMaille";
import { AgregatParTerritoire } from "@/server/chantiers/domain/agrégateurListeChantiers/agregateur.interface";

export type RecupererTauxAvancementTerritoireResult = {
  territoire_code: string;
  jalon: number;
  taux_avancement: number | null;
};

export const extraireTauxAvancementTerritoire = (
  agregat: AgregatParTerritoire,
  territoireCode: string,
): number | null =>
  agregat[determineMaille(territoireCode)]?.territoires[territoireCode]
    ?.repartition.avancements.annuel.moyenne ?? null;

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
    const agregat = await this.agregerChantiersPublies(params.jalon);
    return this.construireResultat(
      agregat,
      params.territoireCode,
      params.jalon,
    );
  }

  async executePourTerritoires(params: {
    territoireCodes: string[];
    jalon: number;
  }): Promise<RecupererTauxAvancementTerritoireResult[]> {
    const agregat = await this.agregerChantiersPublies(params.jalon);
    return params.territoireCodes.map((territoireCode) =>
      this.construireResultat(agregat, territoireCode, params.jalon),
    );
  }

  private async agregerChantiersPublies(
    jalon: number,
  ): Promise<AgregatParTerritoire> {
    const prisma = this.deps.prisma.getInstance();

    const publishedChantiers = await prisma.chantier_identite.findMany({
      where: { statut: $Enums.type_statut.PUBLIE },
      select: { id: true },
    });
    const chantierIds = publishedChantiers.map((chantier) => chantier.id);

    const { agregat } = await this.deps.agregerAvancementsChantiersUseCase.run(
      chantierIds,
      jalon,
    );
    return agregat;
  }

  private construireResultat(
    agregat: AgregatParTerritoire,
    territoireCode: string,
    jalon: number,
  ): RecupererTauxAvancementTerritoireResult {
    return {
      territoire_code: territoireCode,
      jalon,
      taux_avancement: extraireTauxAvancementTerritoire(
        agregat,
        territoireCode,
      ),
    };
  }
}
