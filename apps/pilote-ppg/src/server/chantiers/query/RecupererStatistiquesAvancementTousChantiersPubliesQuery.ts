import { AvancementsStatistiques } from "@/client/components/_commons/Avancements/Avancements.interface";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/shared/maille/Maille.interface";
import { determineMaille } from "@/shared/maille/determineMaille";
import { Inject } from "@/server/chantiers/module";

export type RecupererStatistiquesAvancementTousChantiersPubliesResult = {
  territoire_code: string;
  jalon: number;
  statistiques: AvancementsStatistiques;
};

function determineMailleRepartition(territoireCode: string): Maille {
  const maille = determineMaille(territoireCode);
  return maille === "nationale" ? "departementale" : maille;
}

export class RecupererStatistiquesAvancementTousChantiersPubliesQuery {
  constructor(
    private readonly deps: Inject<
      | "getChantiersHabilitesQuery"
      | "récupérerStatistiquesAvancementChantiersUseCase"
    >,
  ) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
    habilitations: Habilitations;
  }): Promise<RecupererStatistiquesAvancementTousChantiersPubliesResult> {
    const chantierIds = await this.deps.getChantiersHabilitesQuery.execute(
      params.habilitations,
    );

    const mailleRepartition = determineMailleRepartition(params.territoireCode);

    const statistiques =
      await this.deps.récupérerStatistiquesAvancementChantiersUseCase.run(
        chantierIds,
        mailleRepartition,
        params.habilitations,
        params.jalon,
      );

    return {
      territoire_code: params.territoireCode,
      jalon: params.jalon,
      statistiques,
    };
  }
}
