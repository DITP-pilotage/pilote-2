import type { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";

export type EvolutionVAResult = {
  territoires: {
    territoireCode: string;
    historiquesValeurs: { date: string; valeur: number }[];
  }[];
};

export class RecupererEvolutionValeursAvancementTerritoiresQuery {
  constructor(
    private readonly deps: Inject<"listerDetailsIndicateurTerritoireUseCaseV2">,
  ) {}

  async execute(params: {
    indicateurId: string;
    chantierId: string;
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }): Promise<EvolutionVAResult> {
    const result =
      await this.deps.listerDetailsIndicateurTerritoireUseCaseV2.run(
        [params.indicateurId],
        params.chantierId,
        params.habilitations,
        params.profil,
        params.jalon,
      );

    const details = result[params.indicateurId] ?? {};

    const territoires = Object.entries(details).map(
      ([territoireCode, detail]) => ({
        territoireCode,
        historiquesValeurs: detail.historiquesValeurs,
      }),
    );

    return { territoires };
  }
}
