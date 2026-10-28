import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetIndicateursNonAJourTool,
  getIndicateursNonAJourInputSchema,
  type GetIndicateursNonAJourOutput,
} from "@/server/albert/tools/getIndicateursNonAJour";
import type {
  ChantierIndicateursNonAJour,
  GetIndicateursNonAJourQuery,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";

const QUERY_RESULT: ChantierIndicateursNonAJour[] = [
  {
    chantier: { id: "CH-001", nom: "Chantier bornes" },
    indicateurs: [
      {
        id: "IND-001",
        nom: "Nombre de bornes",
        periodicite: "Trimestrielle",
        delaiDisponibiliteMois: 1,
        mailles: [
          {
            maille: "DEPT",
            nbTerritoiresEnRetard: 1,
            nbTerritoiresApplicables: 3,
            territoiresEnRetard: [
              {
                code: "DEPT-29",
                nom: "Finistère",
                dateDerniereValeur: "2026-01-01",
                miseAJourAttendueDepuis: "2026-05-31",
              },
            ],
          },
        ],
      },
    ],
  },
];

const buildTool = ({
  queryResult = QUERY_RESULT,
  territoiresAccessibles = ["NAT-FR", "DEPT-29", "DEPT-35"],
  chantiersAccessibles = ["CH-001", "CH-002"],
  chantierParIndicateur = { "IND-001": "CH-001" },
}: {
  queryResult?: ChantierIndicateursNonAJour[];
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
  chantierParIndicateur?: Record<string, string>;
} = {}) => {
  const query = mock<GetIndicateursNonAJourQuery>();
  query.execute.mockResolvedValue(queryResult);
  const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>();
  getIndicateurContexteQuery.execute.mockImplementation(
    async ({ indicateurId }) => {
      const chantierId = chantierParIndicateur[indicateurId];
      return chantierId
        ? {
            id: indicateurId,
            nom: `Indicateur ${indicateurId}`,
            description: null,
            uniteMesure: null,
            chantier: { id: chantierId, nom: `Chantier ${chantierId}` },
            mailleNatAgregee: false,
            mailleRegAgregee: false,
            parametrageValeurAffichee: null,
          }
        : null;
    },
  );
  const tool = createGetIndicateursNonAJourTool({
    getIndicateursNonAJourQuery: query,
    getIndicateurContexteQuery,
  })({ territoiresAccessibles, chantiersAccessibles });
  return { tool, query };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetIndicateursNonAJourTool>>,
  input: {
    chantier_ids?: string[];
    indicateur_ids?: string[];
    territoire_code?: string;
  },
): Promise<GetIndicateursNonAJourOutput> =>
  tool.execute!(getIndicateursNonAJourInputSchema.parse(input), {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetIndicateursNonAJourOutput>;

describe("createGetIndicateursNonAJourTool execute", () => {
  test("refuse l'accès à un territoire non accessible sans appeler la query", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, { territoire_code: "REG-11" });

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("signale un accès refusé quand aucun chantier demandé n'est accessible", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, { chantier_ids: ["CH-999"] });

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("signale un accès refusé quand l'utilisateur n'a accès à aucun chantier", async () => {
    // Given
    const { tool, query } = buildTool({ chantiersAccessibles: [] });

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("sans argument, borne la query aux chantiers et territoires accessibles, sans détail des territoires", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: undefined,
      avecDetailTerritoires: false,
    });
    expect(result).toEqual({ resultats: QUERY_RESULT });
  });

  test("ne transmet que les chantiers demandés accessibles", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    await executeTool(tool, { chantier_ids: ["CH-001", "CH-999"] });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: undefined,
      avecDetailTerritoires: false,
    });
  });

  test("avec indicateur_ids, demande le détail des territoires en retard", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-001"] });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: ["IND-001"],
      avecDetailTerritoires: true,
    });
    expect(result).toEqual({ resultats: QUERY_RESULT });
  });

  test("signale un accès refusé quand aucun indicateur demandé n'est accessible, sans révéler leur chantier ni appeler la query", async () => {
    // Given
    const { tool, query } = buildTool({
      chantierParIndicateur: { "IND-003": "CH-003" },
    });

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-003"] });

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("ne transmet que les indicateurs demandés accessibles et signale les autres sans révéler leur chantier", async () => {
    // Given
    const { tool, query } = buildTool({
      chantierParIndicateur: { "IND-001": "CH-001", "IND-003": "CH-003" },
    });

    // When
    const result = await executeTool(tool, {
      indicateur_ids: ["IND-001", "IND-003"],
    });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: ["IND-001"],
      avecDetailTerritoires: true,
    });
    expect(result).toEqual({
      resultats: QUERY_RESULT,
      indicateurs_non_accessibles: ["IND-003"],
    });
    expect(JSON.stringify(result)).not.toContain("CH-003");
  });

  test("transmet un indicateur introuvable à la query sans lever d'erreur", async () => {
    // Given
    const { tool, query } = buildTool({ queryResult: [] });

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-404"] });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: ["IND-404"],
      avecDetailTerritoires: true,
    });
    expect(result.resultats).toEqual([]);
  });

  test("avec territoire_code, interroge ce seul territoire en mode détaillé", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    await executeTool(tool, { territoire_code: "DEPT-29" });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["DEPT-29"],
      indicateurIds: undefined,
      avecDetailTerritoires: true,
    });
  });

  test("décrit qu'une liste vide ne prouve pas que les données sont à jour", () => {
    // Given
    const { tool } = buildTool({ queryResult: [] });

    // Then
    expect(tool.description).toContain(
      "ce qui ne prouve pas que les données sont à jour",
    );
  });

  test("signale les chantiers demandés non accessibles pour ne pas les présenter comme à jour", async () => {
    // Given
    const { tool } = buildTool({ queryResult: [] });

    // When
    const result = await executeTool(tool, {
      chantier_ids: ["CH-001", "CH-999"],
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      chantiers_non_accessibles: ["CH-999"],
    });
  });

  test("signale un accès refusé quand l'utilisateur n'a accès à aucun territoire", async () => {
    // Given
    const { tool, query } = buildTool({ territoiresAccessibles: [] });

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("décrit un territoire en retard sans date attendue par une date théorique non calculable, sans en supposer la cause", () => {
    // Given
    const { tool } = buildTool();

    // Then
    expect(tool.description).toContain(
      "la date théorique n'a pas pu être calculée",
    );
    expect(tool.description).not.toContain("n'est pas déclaré");
  });
});
