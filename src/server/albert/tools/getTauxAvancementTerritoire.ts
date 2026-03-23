import { tool } from "ai";
import { z } from "zod";
import { $Enums } from "@prisma/client";
import { MailleNonAutoriséeErreur } from "@/server/utils/errors";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { getContainer } from "@/server/dependances";

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

export type GetTauxAvancementTerritoireOutput =
  GetTauxAvancementTerritoireResult;

function determineMaille(territoireCode: string): Maille {
  if (territoireCode.startsWith("NAT")) return "nationale";
  if (territoireCode.startsWith("REG")) return "regionale";
  return "departementale";
}

export function createGetTauxAvancementTerritoireTool({
  prisma,
}: {
  prisma: PrismaPilote;
}) {
  return ({ habilitations }: { habilitations: Habilitations }) => {
    const territoiresAccessibles = habilitations.lecture.territoires;

    return tool({
      description: `Récupère le taux d'avancement global d'un territoire, la médiane de répartition et la position du territoire par rapport à la médiane.

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

        const maille = determineMaille(input.territoire_code);
        const territoireData =
          agregat[maille].territoires[input.territoire_code];

        const taux_avancement_global =
          territoireData?.repartition.avancements.annuel.moyenne ?? null;

        const repartitionMaille: Maille = input.territoire_code.startsWith(
          "NAT",
        )
          ? "departementale"
          : maille;

        let stats = null;
        try {
          stats = await récupérerStatistiquesUseCase.run(
            chantierIds,
            repartitionMaille,
            habilitations,
            input.jalon,
          );
        } catch (error) {
          if (!(error instanceof MailleNonAutoriséeErreur)) {
            throw error;
          }
        }

        const mediane_repartition = stats?.médiane ?? null;

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
          territoire_code: input.territoire_code,
          jalon: input.jalon,
          taux_avancement_global: formatPourcentage(taux_avancement_global),
          mediane_repartition: formatPourcentage(mediane_repartition),
          position_mediane,
        };
      },
    });
  };
}
