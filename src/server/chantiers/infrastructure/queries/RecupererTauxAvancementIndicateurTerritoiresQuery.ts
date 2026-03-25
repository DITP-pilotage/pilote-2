import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import type { Inject } from "@/server/chantiers/module";
import { MailleTerritoireSelectionne } from "@/server/domain/maille/Maille.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

const MAILLE_PAR_PREFIXE: Record<string, MailleTerritoireSelectionne> = {
  "NAT-": "NAT",
  "REG-": "REG",
  "DEPT-": "DEPT",
};

const determinerMaille = (
  territoireCode: string,
): MailleTerritoireSelectionne => {
  for (const [prefixe, maille] of Object.entries(MAILLE_PAR_PREFIXE)) {
    if (territoireCode.startsWith(prefixe)) return maille;
  }
  return "DEPT";
};

export class RecupererTauxAvancementIndicateurTerritoiresQuery {
  constructor(
    private readonly deps: Inject<
      "listerDetailsIndicateurTerritoireUseCaseV2" | "territoireRepository"
    >,
  ) {}

  async execute(params: {
    indicateurId: string;
    chantierId: string;
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }): Promise<TauxAvancementComparaisonTerritoireViewModel[]> {
    const result =
      await this.deps.listerDetailsIndicateurTerritoireUseCaseV2.run(
        [params.indicateurId],
        params.chantierId,
        params.habilitations,
        params.profil,
        params.jalon,
      );

    const details = result[params.indicateurId] ?? {};

    const territoires = await this.deps.territoireRepository.récupérerTousNew();
    const territoiresMap = new Map(
      territoires.map((territoire) => [territoire.code, territoire]),
    );

    return Object.entries(details).map(([territoireCode, detail]) => ({
      territoireCode,
      territoireNom: territoiresMap.get(territoireCode)?.nomAffiché ?? "",
      maille: determinerMaille(territoireCode),
      tauxAvancementJalon: detail.avancement.annuel,
      estApplicable: detail.estApplicable,
      dateTauxAvancementAnnuel: detail.dateValeurAvancement
        ? new Date(detail.dateValeurAvancement).toISOString()
        : null,
    }));
  }
}
