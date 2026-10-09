import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetIndicateursNonAJourTool,
  type GetIndicateursNonAJourOutput,
} from "@/server/albert/tools/getIndicateursNonAJour";
import type {
  ChantierIndicateursNonAJour,
  RecupererIndicateursNonAJourQuery,
} from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";
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
  const query = mock<RecupererIndicateursNonAJourQuery>();
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
          }
        : null;
    },
  );
  const tool = createGetIndicateursNonAJourTool({
    recupererIndicateursNonAJourQuery: query,
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
  tool.execute!(input, {
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
      _output_instructions: expect.any(String),
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("répond explicitement quand aucun chantier demandé n'est accessible", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, { chantier_ids: ["CH-999"] });

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("répond explicitement quand l'utilisateur n'a accès à aucun chantier", async () => {
    // Given
    const { tool, query } = buildTool({ chantiersAccessibles: [] });

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "L'utilisateur n'a accès à aucun chantier : aucune donnée de mise à jour ne peut être consultée.",
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
    expect(result).toEqual({
      resultats: QUERY_RESULT,
      _output_instructions: expect.stringContaining(
        "Le détail par territoire n'est pas inclus",
      ),
    });
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
    expect(result).toEqual({
      resultats: QUERY_RESULT,
      _output_instructions: expect.stringContaining(
        "Liste les territoires en retard",
      ),
    });
  });

  test("répond explicitement quand aucun indicateur demandé n'est accessible, sans révéler leur chantier ni appeler la query", async () => {
    // Given
    const { tool, query } = buildTool({
      chantierParIndicateur: { "IND-003": "CH-003" },
    });

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-003"] });

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "Aucun des indicateurs demandés n'est accessible pour cet utilisateur.",
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
    expect(result._output_instructions).toContain(
      "Ces indicateurs demandés ne sont pas accessibles à l'utilisateur : IND-003.",
    );
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
    const result = await executeTool(tool, { territoire_code: "DEPT-29" });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["DEPT-29"],
      indicateurIds: undefined,
      avecDetailTerritoires: true,
    });
    expect(result._output_instructions).toContain(
      "Liste les territoires en retard",
    );
  });

  test("sur un résultat vide, ne conclut pas que les données sont à jour", async () => {
    // Given
    const { tool } = buildTool({ queryResult: [] });

    // When
    const result = await executeTool(tool, {
      indicateur_ids: ["IND-404"],
      territoire_code: "DEPT-29",
    });

    // Then
    expect(result.resultats).toEqual([]);
    expect(result._output_instructions).toContain(
      "Aucun indicateur non à jour n'a été trouvé sur le périmètre demandé.",
    );
    expect(result._output_instructions).not.toContain(
      "toutes les données interrogées sont à jour",
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
    expect(result._output_instructions).toContain(
      "Ces chantiers demandés ne sont pas accessibles à l'utilisateur : CH-999.",
    );
  });

  test("répond explicitement quand l'utilisateur n'a accès à aucun territoire", async () => {
    // Given
    const { tool, query } = buildTool({ territoiresAccessibles: [] });

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(result).toEqual({
      resultats: [],
      _output_instructions:
        "L'utilisateur n'a accès à aucun territoire : aucune donnée de mise à jour ne peut être consultée.",
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("explique un territoire en retard sans date attendue par une date théorique non calculable, sans en supposer la cause", async () => {
    // Given
    const { tool } = buildTool();

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-001"] });

    // Then
    expect(result._output_instructions).toContain(
      "Si miseAJourAttendueDepuis est null alors que dateDerniereValeur est renseignée, la date théorique de mise à jour n'a pas pu être calculée : dis-le au lieu d'afficher une date.",
    );
    expect(result._output_instructions).not.toContain("n'est pas déclaré");
  });
});
