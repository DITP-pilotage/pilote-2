import { tool } from "ai";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import { MailleNonAutoriséeErreur } from "@/server/utils/errors";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { getContainer } from "@/server/dependances";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const getTauxAvancementTerritoireInputSchema = z.object({
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
      "Si true, inclut les données des sous-territoires (ex: départements d'une région)",
    ),
});

export type GetTauxAvancementTerritoireResult = {
  territoire_code: string;
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
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Présente le TA, la médiane et la position pour chaque territoire. Un seul territoire → paragraphe factuel. Plusieurs territoires → tableau comparatif.`;

function determineMaille(territoireCode: string): Maille {
  if (territoireCode.startsWith("NAT")) return "nationale";
  if (territoireCode.startsWith("REG")) return "regionale";
  return "departementale";
}

export function createGetTauxAvancementTerritoireTool({
  prisma,
  territoireResolver,
}: {
  prisma: PrismaPilote;
  territoireResolver: TerritoireResolver;
}) {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    const territoiresAccessibles = habilitations.lecture.territoires;

    return tool({
      description: `Récupère le taux d'avancement global d'un territoire, la médiane de répartition et la position du territoire par rapport à la m��diane.
Quand include_sous_territoires=true, retourne aussi les données de chaque sous-territoire.

Utilise cet outil quand l'utilisateur demande :
- Le taux d'avancement d'un territoire
- La position d'un territoire par rapport à la médiane
- Une vue d'ensemble rapide d'un territoire`,
      inputSchema: getTauxAvancementTerritoireInputSchema,
      execute: async (input): Promise<GetTauxAvancementTerritoireOutput> => {
        if (!territoiresAccessibles.includes(input.territoire_code)) {
          throw new Error(
            `Accès non autorisé au territoire ${input.territoire_code}`,
          );
        }

        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );
        const codesAccessibles = codes.filter((code) =>
          territoiresAccessibles.includes(code),
        );

        const db = prisma.getInstance();

        const publishedChantiers = await db.chantier_identite.findMany({
          where: { statut: $Enums.type_statut.PUBLIE },
          select: { id: true },
        });

        const chantierIds = publishedChantiers.map((c) => c.id);

        const legacyContainer = getContainer("legacy");
        const agregerAvancementsChantiersUseCase = legacyContainer.resolve(
          "agregerAvancementsChantiersUseCase",
        );
        const récupérerStatistiquesUseCase = getContainer("chantiers").resolve(
          "récupérerStatistiquesAvancementChantiersUseCase",
        );

        const { agregat } = await agregerAvancementsChantiersUseCase.run(
          chantierIds,
          input.jalon,
        );

        const mailles = new Set(codesAccessibles.map(determineMaille));
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

        const resultats = codesAccessibles.map((code) => {
          const maille = determineMaille(code);
          const territoireData = agregat[maille]?.territoires[code];

          const taux_avancement_global =
            territoireData?.repartition.avancements.annuel.moyenne ?? null;

          const mediane_repartition = statsByMaille.get(maille) ?? null;

          let position_mediane:
            | "EN_RETARD"
            | "EN_AVANCE"
            | "DANS_LA_MEDIANE"
            | null = null;
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
            jalon: input.jalon,
            taux_avancement_global: formatPourcentage(taux_avancement_global),
            mediane_repartition: formatPourcentage(mediane_repartition),
            position_mediane,
          };
        });

        return {
          resultats,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
