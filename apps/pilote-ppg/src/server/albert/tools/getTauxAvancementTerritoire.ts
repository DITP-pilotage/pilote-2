import { tool } from "ai";
import { z } from "zod";
import { MailleNonAutoriséeErreur } from "@/shared/errors/authorization-errors";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/shared/maille/Maille.interface";
import { getContainer } from "@/server/dependances";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import {
  descriptionPerimetre,
  variantesPerimetre,
} from "@/server/albert/tools/perimetre";
import { determineMaille } from "@/shared/maille/determineMaille";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";

export const getTauxAvancementTerritoireInputSchema = z.object({
  perimetre: z
    .discriminatedUnion("type", [
      variantesPerimetre.SELECTION,
      variantesPerimetre.REGION_ET_SES_DEPARTEMENTS,
      variantesPerimetre.FRANCE_ET_SES_REGIONS,
      variantesPerimetre.TOUTES_REGIONS,
      variantesPerimetre.TOUS_DEPARTEMENTS,
    ])
    .describe(
      descriptionPerimetre({
        types: [
          "SELECTION",
          "REGION_ET_SES_DEPARTEMENTS",
          "FRANCE_ET_SES_REGIONS",
          "TOUTES_REGIONS",
          "TOUS_DEPARTEMENTS",
        ],
      }),
    ),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
});

export type GetTauxAvancementTerritoireResult = {
  territoire_code: string;
  /** Le nom à écrire dans la réponse : sans lui, Albert désignait le territoire par son code. */
  territoire_nom: string | null;
  jalon: number;
  taux_avancement_global: string;
  mediane_repartition: string;
  position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null;
};

function formatPourcentage(value: number | null | undefined): string {
  return `${value?.toFixed(0) ?? "- "}%`;
}

export type GetTauxAvancementTerritoireOutput = {
  resultats: GetTauxAvancementTerritoireResult[];
};

/**
 * La collecte de `get_taux_avancement_territoire`, partagée avec les outils
 * d'encart.
 */
export async function collecterTauxAvancement({
  input,
  territoireResolver,
  getTerritoiresIdentiteQuery,
  habilitations,
}: {
  input: {
    perimetre: Perimetre;
    jalon: number;
  };
  territoireResolver: TerritoireResolver;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
  habilitations: Habilitations;
}): Promise<GetTauxAvancementTerritoireOutput> {
  const codes = await territoireResolver.resoudre(input.perimetre);

  const chantiersContainer = getContainer("chantiers");
  const chantierIds = await chantiersContainer
    .resolve("getChantiersHabilitesQuery")
    .execute(habilitations);
  const récupérerStatistiquesUseCase = chantiersContainer.resolve(
    "récupérerStatistiquesAvancementChantiersUseCase",
  );
  const tauxParTerritoire = new Map(
    (
      await chantiersContainer
        .resolve("recupererTauxAvancementTerritoireQuery")
        .executePourTerritoires({
          territoireCodes: codes,
          jalon: input.jalon,
          habilitations,
        })
    ).map((resultat) => [resultat.territoire_code, resultat.taux_avancement]),
  );

  const nomParTerritoire = new Map(
    (await getTerritoiresIdentiteQuery.execute()).map((territoire) => [
      territoire.code,
      territoire.nom,
    ]),
  );

  const mailles = new Set(codes.map(determineMaille));
  const statsByMaille = new Map<Maille, number | null>();

  for (const maille of mailles) {
    const repartitionMaille: Maille =
      maille === "nationale" ? "departementale" : maille;

    try {
      const stats = await récupérerStatistiquesUseCase.run(
        chantierIds,
        repartitionMaille,
        habilitations,
        input.jalon,
      );
      statsByMaille.set(maille, stats?.médiane ?? null);
    } catch (error) {
      if (!(error instanceof MailleNonAutoriséeErreur)) {
        throw error;
      }
      statsByMaille.set(maille, null);
    }
  }

  const resultats = codes.map((code) => {
    const maille = determineMaille(code);
    const taux_avancement_global = tauxParTerritoire.get(code) ?? null;

    const mediane_repartition = statsByMaille.get(maille) ?? null;

    let position_mediane: "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null =
      null;
    if (taux_avancement_global !== null && mediane_repartition !== null) {
      const ecart = taux_avancement_global - mediane_repartition;
      if (ecart <= -10) {
        position_mediane = "EN_RETARD";
      } else if (ecart >= 10) {
        position_mediane = "EN_AVANCE";
      } else {
        position_mediane = "DANS_LA_MEDIANE";
      }
    }

    return {
      territoire_code: code,
      territoire_nom: nomParTerritoire.get(code) ?? null,
      jalon: input.jalon,
      taux_avancement_global: formatPourcentage(taux_avancement_global),
      mediane_repartition: formatPourcentage(mediane_repartition),
      position_mediane,
    };
  });

  return { resultats };
}

export function createGetTauxAvancementTerritoireTool({
  territoireResolver,
  getTerritoiresIdentiteQuery,
}: {
  territoireResolver: TerritoireResolver;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
}) {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    return tool({
      description: `Renvoie, pour chaque territoire du périmètre, son taux d'avancement global à un jalon, la médiane des territoires de sa maille et sa position face à cette médiane.
- Pour NAT-FR, la médiane est celle des départements.
- « - % » : pas de donnée à ce jalon.
- \`territoire_nom\` : le nom à écrire dans la réponse, plutôt que le code.
Utilise-le pour : « quel est le taux d'avancement de la Bretagne ? », la position d'un territoire face à la médiane, une comparaison entre territoires ou entre jalons, le classement des régions ou des départements ; un ensemble de territoires (« la Bretagne et ses départements », « tous les départements ») : un seul appel avec le \`perimetre\` adapté.
Ne l'utilise pas pour : le taux d'avancement d'un chantier → get_chantiers.`,
      inputSchema: getTauxAvancementTerritoireInputSchema,
      execute: (input): Promise<GetTauxAvancementTerritoireOutput> =>
        collecterTauxAvancement({
          input,
          territoireResolver,
          getTerritoiresIdentiteQuery,
          habilitations,
        }),
    });
  };
}
