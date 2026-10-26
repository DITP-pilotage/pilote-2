import { $Enums } from "@prisma/client";
import { MailleNonAutoriséeErreur } from "@/shared/errors/authorization-errors";
import type { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import type { Maille } from "@/shared/maille/Maille.interface";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import { determineMaille } from "@/shared/maille/determineMaille";
import type { RecupererTauxAvancementTerritoireQuery } from "@/server/chantiers/query/RecupererTauxAvancementTerritoireQuery";
import type { RecupererStatistiquesAvancementChantiersUseCase } from "@/server/chantiers/usecases/RecupererStatistiquesAvancementChantiersUseCase";

export type ReadTauxAvancementParams = {
  territoireCode: string;
  jalon: number;
  includeSousTerritoires: boolean;
};

export type TauxAvancementTerritoireResult = {
  territoire_code: string;
  jalon: number;
  taux_avancement_global: string;
  mediane_repartition: string;
  position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null;
};

function formatPourcentage(value: number | null | undefined): string {
  return `${value?.toFixed(0) ?? "- "}%`;
}

export class TauxAvancementTerritoireReader {
  constructor(
    private readonly deps: {
      prisma: PrismaPilote;
      territoireResolver: TerritoireResolver;
      recupererTauxAvancementTerritoireQuery: RecupererTauxAvancementTerritoireQuery;
      récupérerStatistiquesAvancementChantiersUseCase: RecupererStatistiquesAvancementChantiersUseCase;
    },
  ) {}

  async execute(
    params: ReadTauxAvancementParams,
    habilitations: Habilitations,
  ): Promise<TauxAvancementTerritoireResult[]> {
    const codes = await this.deps.territoireResolver.resoudre(
      params.territoireCode,
      params.includeSousTerritoires,
    );

    const publishedChantiers = await this.deps.prisma
      .getInstance()
      .chantier_identite.findMany({
        where: { statut: $Enums.type_statut.PUBLIE },
        select: { id: true },
      });
    const chantierIds = publishedChantiers.map((chantier) => chantier.id);

    const tauxParTerritoire = new Map(
      (
        await this.deps.recupererTauxAvancementTerritoireQuery.executePourTerritoires(
          { territoireCodes: codes, jalon: params.jalon },
        )
      ).map((resultat) => [resultat.territoire_code, resultat.taux_avancement]),
    );

    const mailles = new Set(codes.map(determineMaille));
    const medianeParMaille = new Map<Maille, number | null>();

    for (const maille of mailles) {
      const repartitionMaille: Maille =
        maille === "nationale" ? "departementale" : maille;

      try {
        const stats =
          await this.deps.récupérerStatistiquesAvancementChantiersUseCase.run(
            chantierIds,
            repartitionMaille,
            habilitations,
            params.jalon,
          );
        medianeParMaille.set(maille, stats?.médiane ?? null);
      } catch (error) {
        if (!(error instanceof MailleNonAutoriséeErreur)) {
          throw error;
        }
        medianeParMaille.set(maille, null);
      }
    }

    return codes.map((code) => {
      const tauxAvancementGlobal = tauxParTerritoire.get(code) ?? null;
      const mediane = medianeParMaille.get(determineMaille(code)) ?? null;

      return {
        territoire_code: code,
        jalon: params.jalon,
        taux_avancement_global: formatPourcentage(tauxAvancementGlobal),
        mediane_repartition: formatPourcentage(mediane),
        position_mediane: computePositionMediane(tauxAvancementGlobal, mediane),
      };
    });
  }
}

function computePositionMediane(
  tauxAvancementGlobal: number | null,
  mediane: number | null,
): TauxAvancementTerritoireResult["position_mediane"] {
  if (tauxAvancementGlobal === null || mediane === null) return null;

  const ecart = tauxAvancementGlobal - mediane;
  if (ecart <= -10) return "EN_RETARD";
  if (ecart >= 10) return "EN_AVANCE";
  return "DANS_LA_MEDIANE";
}
