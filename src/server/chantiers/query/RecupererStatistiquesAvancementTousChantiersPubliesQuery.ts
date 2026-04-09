import { $Enums } from "@prisma/client";
import { AvancementsStatistiques } from "@/client/components/_commons/Avancements/Avancements.interface";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { Inject } from "@/server/chantiers/module";

export type RecupererStatistiquesAvancementTousChantiersPubliesResult = {
  territoire_code: string;
  jalon: number;
  statistiques: AvancementsStatistiques;
};

function determineMaille(territoireCode: string): Maille {
  if (territoireCode.startsWith("NAT")) return "nationale";
  if (territoireCode.startsWith("REG")) return "regionale";
  return "departementale";
}

function determineMailleRepartition(territoireCode: string): Maille {
  const maille = determineMaille(territoireCode);
  return maille === "nationale" ? "departementale" : maille;
}

export class RecupererStatistiquesAvancementTousChantiersPubliesQuery {
  constructor(
    private readonly deps: Inject<
      "prisma" | "récupérerStatistiquesAvancementChantiersUseCase"
    >,
  ) {}

  async execute(params: {
    territoireCode: string;
    jalon: number;
    habilitations: Habilitations;
  }): Promise<RecupererStatistiquesAvancementTousChantiersPubliesResult> {
    const prisma = this.deps.prisma.getInstance();

    const publishedChantiers = await prisma.chantier_identite.findMany({
      where: { statut: $Enums.type_statut.PUBLIE },
      select: { id: true },
    });
    const chantierIds = publishedChantiers.map((chantier) => chantier.id);

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
