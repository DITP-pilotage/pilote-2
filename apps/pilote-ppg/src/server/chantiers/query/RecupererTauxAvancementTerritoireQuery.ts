import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { Inject } from "@/server/chantiers/module";
import { determineMaille } from "@/shared/maille/determineMaille";
import { AgregatParTerritoire } from "@/server/chantiers/domain/agregateurListeChantiers/agregateur.interface";

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
      "getChantiersHabilitesQuery" | "agregerAvancementsChantiersUseCase"
    >,
  ) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
    habilitations: Habilitations;
  }): Promise<RecupererTauxAvancementTerritoireResult> {
    const agregat = await this.agregerChantiersHabilites(
      params.habilitations,
      params.jalon,
    );
    return this.construireResultat(
      agregat,
      params.territoireCode,
      params.jalon,
    );
  }

  async executePourTerritoires(params: {
    territoireCodes: string[];
    jalon: number;
    habilitations: Habilitations;
  }): Promise<RecupererTauxAvancementTerritoireResult[]> {
    const agregat = await this.agregerChantiersHabilites(
      params.habilitations,
      params.jalon,
    );
    return params.territoireCodes.map((territoireCode) =>
      this.construireResultat(agregat, territoireCode, params.jalon),
    );
  }

  private async agregerChantiersHabilites(
    habilitations: Habilitations,
    jalon: number,
  ): Promise<AgregatParTerritoire> {
    const chantierIds =
      await this.deps.getChantiersHabilitesQuery.execute(habilitations);

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
