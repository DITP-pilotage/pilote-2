import type { Inject } from "@/server/chantiers/module";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";

export type EvolutionVAResult = {
  territoires: {
    territoireCode: string;
    historiquesValeurs: { date: string; valeur: number }[];
  }[];
};

export class RecupererEvolutionValeursAvancementTerritoiresQuery {
  constructor(
    private readonly deps: Inject<"listerDetailsIndicateurTerritoireUseCase">,
  ) {}

  async execute(params: {
    indicateurId: string;
    chantierId: string;
    jalon: number;
    habilitations: Habilitations;
    profil: ProfilCode;
  }): Promise<EvolutionVAResult> {
    const result = await this.deps.listerDetailsIndicateurTerritoireUseCase.run(
      [params.indicateurId],
      params.chantierId,
      params.habilitations,
      params.profil,
      params.jalon,
    );

    const details = result[params.indicateurId] ?? {};

    const territoires = Object.entries(details)
      .map(([territoireCode, detail]) => ({
        territoireCode,
        historiquesValeurs: detail.historiquesValeurs.map(
          ({ date, valeur }) => ({ date, valeur }),
        ),
      }))
      .filter((territoire) => territoire.historiquesValeurs.length > 0);

    return { territoires };
  }
}
