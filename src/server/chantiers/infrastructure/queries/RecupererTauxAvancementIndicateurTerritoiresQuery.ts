import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import type { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

export class RecupererTauxAvancementIndicateurTerritoiresQuery {
  constructor(
    private readonly deps: Inject<"listerDetailsIndicateurTerritoireUseCaseV2">,
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

    return Object.entries(details).map(([territoireCode, detail]) => ({
      territoireCode,
      maille: territoireCodeVersMailleCodeInsee(territoireCode).maille,
      tauxAvancementJalon: detail.avancement.annuel,
      estApplicable: detail.estApplicable,
      dateTauxAvancementAnnuel: detail.dateValeurAvancement
        ? new Date(detail.dateValeurAvancement).toISOString()
        : null,
    }));
  }
}
