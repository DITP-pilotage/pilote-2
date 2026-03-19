import { AvancementTerritoireViewModel } from "@/server/chantiers/app/contrats/AvancementTerritoireContrat";
import { Inject } from "@/server/chantiers/module";
import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";

export class RecupererAvancementsTerritoiresQuery {
  constructor(
    private readonly deps: Inject<
      "agregerAvancementsChantiersUseCase" | "territoireRepository"
    >,
  ) {}

  async run(params: {
    chantierIds: string[];
    jalon: number;
  }): Promise<AvancementTerritoireViewModel[]> {
    const { agregat, chantiers } =
      await this.deps.agregerAvancementsChantiersUseCase.run(
        params.chantierIds,
        params.jalon,
      );

    const territoires = await this.deps.territoireRepository.récupérerTousNew();
    const territoiresMap = new Map(
      territoires.map((territoire) => [territoire.code, territoire]),
    );

    const result: AvancementTerritoireViewModel[] = [];

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
          codeInsee: territoireCode,
          maille: mailleCode,
          avancementAnnuel: territoire.repartition.avancements.annuel.moyenne,
          estApplicable: chantiers.some(
            (chantier) =>
              chantier.mailles[maille][territoireCode]?.estApplicable !== false,
          )
            ? null
            : chantiers.some(
                  (chantier) => territoireCode in chantier.mailles[maille],
                )
              ? false
              : null,
          dateTauxAvancementAnnuel: chantiers.reduce<string | null>(
            (max, chantier) => {
              const date =
                chantier.mailles[maille][territoireCode]
                  ?.dateTauxAvancementAnnuel ?? null;
              if (date === null) return max;
              return max === null || date > max ? date : max;
            },
            null,
          ),
        });
      }
    }

    return result;
  }
}
