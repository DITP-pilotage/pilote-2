import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetTauxAvancementTerritoireTool,
  type GetTauxAvancementTerritoireOutput,
} from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

const TAUX: Record<string, number | null> = {
  "REG-76": 62,
  "DEPT-31": 40,
  "DEPT-09": null,
  "DEPT-32": 71,
};

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
          executePourTerritoires: async ({
            territoireCodes,
          }: {
            territoireCodes: string[];
          }) =>
            territoireCodes.map((code) => ({
              territoire_code: code,
              taux_avancement: TAUX[code],
            })),
        },
      })[nom],
  }),
}));

const buildTool = (codes: string[] = ["REG-76", "DEPT-31"]) =>
  createGetTauxAvancementTerritoireTool({
    territoireResolver: mock<TerritoireResolver>({
      resoudre: async () => codes,
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
        tri: "taux_decroissant",
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
      total: 2,
    });
  });

  test.each([
    ["taux_decroissant", ["DEPT-32", "REG-76", "DEPT-31", "DEPT-09"]],
    ["taux_croissant", ["DEPT-31", "REG-76", "DEPT-32", "DEPT-09"]],
  ] as const)(
    "trie par %s, les territoires sans donnée en dernier",
    async (tri, ordre) => {
      // Given
      const tool = buildTool(["REG-76", "DEPT-31", "DEPT-09", "DEPT-32"]);

      // When
      const result = (await tool.execute!(
        { perimetre: { type: "TOUS_DEPARTEMENTS" }, jalon: 2025, tri },
        {
          toolCallId: "test",
          messages: [],
          abortSignal: undefined,
          context: {},
        },
      )) as GetTauxAvancementTerritoireOutput;

      // Then
      expect(
        result.resultats.map((resultat) => resultat.territoire_code),
      ).toEqual(ordre);
    },
  );

  test("garde les premiers territoires après le tri, et signale la liste tronquée", async () => {
    // Given
    const tool = buildTool(["REG-76", "DEPT-31", "DEPT-09", "DEPT-32"]);

    // When
    const result = (await tool.execute!(
      {
        perimetre: { type: "TOUS_DEPARTEMENTS" },
        jalon: 2025,
        tri: "taux_decroissant",
        limite: 2,
      },
      { toolCallId: "test", messages: [], abortSignal: undefined, context: {} },
    )) as GetTauxAvancementTerritoireOutput;

    // Then
    expect({
      codes: result.resultats.map((resultat) => resultat.territoire_code),
      total: result.total,
      tronque: result.tronque,
    }).toEqual({ codes: ["DEPT-32", "REG-76"], total: 4, tronque: true });
  });
});
