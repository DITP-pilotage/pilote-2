import type { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { PVATerritoireViewModel } from "./GetChantierPVACountTerritoiresQuery";

export class GetIndicateurPVACountTerritoiresQuery {
  constructor(
    private readonly deps: Inject<
      "listerDetailsIndicateurTerritoireUseCase" | "territoireRepository"
    >,
  ) {}

  async execute(params: {
    indicateurId: string;
    chantierId: string;
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }): Promise<PVATerritoireViewModel[]> {
    const result = await this.deps.listerDetailsIndicateurTerritoireUseCase.run(
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
      codeInsee: detail.codeInsee,
      maille: territoireCodeVersMailleCodeInsee(territoireCode).maille,
      nombrePropositionsValeur: detail.proposition !== null ? 1 : 0,
      estApplicable: detail.estApplicable,
    }));
  }
}
