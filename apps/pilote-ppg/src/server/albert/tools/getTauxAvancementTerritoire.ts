import { tool } from "ai";
import { z } from "zod";
import { MailleNonAutoriséeErreur } from "@/shared/errors/authorization-errors";
import { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/shared/maille/Maille.interface";
import { getContainer } from "@/server/dependances";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import { determineMaille } from "@/shared/maille/determineMaille";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";

export const getTauxAvancementTerritoireInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "`true` pour un territoire ET ses sous-territoires : un seul appel sur le parent, jamais un appel par sous-territoire.",
    ),
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

export function createGetTauxAvancementTerritoireTool({
  territoireResolver,
  getTerritoiresIdentiteQuery,
}: {
  territoireResolver: TerritoireResolver;
  getTerritoiresIdentiteQuery: GetTerritoiresIdentiteQuery;
}) {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    return tool({
      description: `Renvoie le taux d'avancement global d'un territoire à un jalon, la médiane des territoires de sa maille et sa position face à cette médiane.
- Pour NAT-FR, la médiane est celle des départements.
- « - % » : pas de donnée à ce jalon.
- \`territoire_nom\` : le nom à écrire dans la réponse, plutôt que le code.
Utilise-le pour : « quel est le taux d'avancement de la Bretagne ? », la position d'un territoire face à la médiane, une comparaison entre territoires ou entre jalons ; un territoire et ses sous-territoires : un seul appel sur le parent avec \`include_sous_territoires\`.
Ne l'utilise pas pour : le taux d'avancement d'un chantier → get_chantiers.`,
      inputSchema: getTauxAvancementTerritoireInputSchema,
      execute: async (input): Promise<GetTauxAvancementTerritoireOutput> => {
        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );

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
          ).map((resultat) => [
            resultat.territoire_code,
            resultat.taux_avancement,
          ]),
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

          let position_mediane:
            "EN_RETARD" | "EN_AVANCE" | "DANS_LA_MEDIANE" | null = null;
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
      },
    });
  };
}
