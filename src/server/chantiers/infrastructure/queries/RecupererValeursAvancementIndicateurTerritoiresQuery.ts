import type { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export type ValeurAvancementIndicateurTerritoire = {
  territoireCode: string;
  valeurAvancement: number | null;
  valeurCibleAnnuelle: number | null;
  estApplicable: boolean | null;
  dateValeurAvancement: string | null;
};

export class RecupererValeursAvancementIndicateurTerritoiresQuery {
  constructor(
    private readonly deps: Inject<"listerDetailsIndicateurTerritoireUseCaseV2">,
  ) {}

  async execute(params: {
    indicateurId: string;
    chantierId: string;
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }): Promise<ValeurAvancementIndicateurTerritoire[]> {
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
      valeurAvancement: detail.valeurAvancement,
      valeurCibleAnnuelle: detail.valeurCibleAnnuelle,
      estApplicable: detail.estApplicable,
      dateValeurAvancement: detail.dateValeurAvancement,
    }));
  }
}
