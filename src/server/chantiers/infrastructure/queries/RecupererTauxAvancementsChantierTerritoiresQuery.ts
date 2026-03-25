import { ChantierPourAgregation } from "@/client/utils/chantier/agrégateurListeChantiers/agregateur";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import { Inject } from "@/server/chantiers/module";
import {
  Maille,
  MailleTerritoireSelectionne,
} from "@/server/domain/maille/Maille.interface";

export class RecupererTauxAvancementsChantierTerritoiresQuery {
  constructor(
    private readonly deps: Inject<
      // TODO: cette query de couche infra ne devrait pas dépendre d'un use case — toléré ici pour des raisons legacy
      "agregerAvancementsChantiersUseCase" | "territoireRepository"
    >,
  ) {}

  async run(params: {
    chantierIds: string[];
    jalon: number;
  }): Promise<TauxAvancementComparaisonTerritoireViewModel[]> {
    const { agregat, chantiers } =
      await this.deps.agregerAvancementsChantiersUseCase.run(
        params.chantierIds,
        params.jalon,
      );

    const territoires = await this.deps.territoireRepository.récupérerTousNew();
    const territoiresMap = new Map(
      territoires.map((territoire) => [territoire.code, territoire]),
    );

    const result: TauxAvancementComparaisonTerritoireViewModel[] = [];

    const mailleMapping: Array<{
      maille: keyof typeof agregat;
      mailleCode: MailleTerritoireSelectionne;
    }> = [
      { maille: "nationale", mailleCode: "NAT" },
      { maille: "regionale", mailleCode: "REG" },
      { maille: "departementale", mailleCode: "DEPT" },
    ];

    for (const { maille, mailleCode } of mailleMapping) {
      for (const [territoireCode, territoire] of Object.entries(
        agregat[maille].territoires,
      )) {
        result.push({
          territoireCode,
          territoireNom: territoiresMap.get(territoireCode)?.nomAffiché ?? "",
          maille: mailleCode,
          tauxAvancementJalon:
            territoire.repartition.avancements.annuel.moyenne,
          estApplicable: this._calculerEstApplicable({
            chantiers,
            maille,
            territoireCode,
          }),
          dateTauxAvancementAnnuel: this._calculerDateTauxAvancementAnnuel({
            chantiers,
            maille,
            territoireCode,
          }),
        });
      }
    }

    return result;
  }

  private _calculerEstApplicable({
    chantiers,
    maille,
    territoireCode,
  }: {
    chantiers: ChantierPourAgregation[];
    maille: Maille;
    territoireCode: string;
  }): boolean | null {
    const chantiersAvecTerritoire = chantiers.filter(
      (chantier) => territoireCode in chantier.mailles[maille],
    );
    if (chantiersAvecTerritoire.length === 0) return null;

    const tousNonApplicables = chantiersAvecTerritoire.every(
      (chantier) =>
        chantier.mailles[maille][territoireCode]?.estApplicable === false,
    );
    if (tousNonApplicables) return false;

    const tousApplicables = chantiersAvecTerritoire.every(
      (chantier) =>
        chantier.mailles[maille][territoireCode]?.estApplicable === true,
    );
    if (tousApplicables) return true;

    return null;
  }

  private _calculerDateTauxAvancementAnnuel({
    chantiers,
    maille,
    territoireCode,
  }: {
    chantiers: ChantierPourAgregation[];
    maille: Maille;
    territoireCode: string;
  }): string | null {
    return chantiers.reduce<string | null>((max, chantier) => {
      const date =
        chantier.mailles[maille][territoireCode]?.dateTauxAvancementAnnuel ??
        null;
      if (date === null) return max;
      return max === null || date > max ? date : max;
    }, null);
  }
}
