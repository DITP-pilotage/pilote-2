import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetTauxAvancementTerritoireTool,
  type GetTauxAvancementTerritoireOutput,
} from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

// L'outil lit les taux et la médiane dans le container du module chantiers
vi.mock("@/server/dependances", () => ({
  getContainer: () => ({
    resolve: (nom: string) =>
      ({
        getChantiersHabilitesQuery: { execute: async () => ["CH-001"] },
        récupérerStatistiquesAvancementChantiersUseCase: {
          run: async () => ({ médiane: 50 }),
        },
        recupererTauxAvancementTerritoireQuery: {
          executePourTerritoires: async () => [
            { territoire_code: "REG-76", taux_avancement: 62 },
            { territoire_code: "DEPT-31", taux_avancement: 40 },
          ],
        },
      })[nom],
  }),
}));

const buildTool = () =>
  createGetTauxAvancementTerritoireTool({
    territoireResolver: mock<TerritoireResolver>({
      resoudre: async () => ["REG-76", "DEPT-31"],
    }),
    getTerritoiresIdentiteQuery: mock<GetTerritoiresIdentiteQuery>({
      execute: async () => [
        {
          code: "REG-76",
          nom: "Occitanie",
          maille: "REG",
          code_parent: "NAT-FR",
        },
        {
          code: "DEPT-31",
          nom: "Haute-Garonne",
          maille: "DEPT",
          code_parent: "REG-76",
        },
      ],
    }),
  })({ habilitations: {} as Habilitations });

describe("createGetTauxAvancementTerritoireTool execute", () => {
  test("nomme chaque territoire, pour que la réponse ne le désigne pas par son code", async () => {
    // Given
    const tool = buildTool();

    // When
    const result = (await tool.execute!(
      {
        perimetre: {
          type: "REGION_ET_SES_DEPARTEMENTS",
          region_code: "REG-76",
        },
        jalon: 2025,
      },
      { toolCallId: "test", messages: [], abortSignal: undefined, context: {} },
    )) as GetTauxAvancementTerritoireOutput;

    // Then
    expect(result).toEqual({
      resultats: [
        {
          territoire_code: "REG-76",
          territoire_nom: "Occitanie",
          jalon: 2025,
          taux_avancement_global: "62%",
          mediane_repartition: "50%",
          position_mediane: "EN_AVANCE",
        },
        {
          territoire_code: "DEPT-31",
          territoire_nom: "Haute-Garonne",
          jalon: 2025,
          taux_avancement_global: "40%",
          mediane_repartition: "50%",
          position_mediane: "EN_RETARD",
        },
      ],
    });
  });
});
