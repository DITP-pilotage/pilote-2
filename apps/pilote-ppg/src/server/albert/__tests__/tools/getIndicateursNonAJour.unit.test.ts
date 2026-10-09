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
import type {
  IndicateurDemande,
  VerifierIndicateursDemandesQuery,
} from "@/server/chantiers/infrastructure/queries/VerifierIndicateursDemandesQuery";

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
  indicateursDemandes = [
    { id: "IND-001", chantierId: "CH-001", estApplicable: true },
  ],
  territoiresAccessibles = ["NAT-FR", "DEPT-29", "DEPT-35"],
  chantiersAccessibles = ["CH-001", "CH-002"],
}: {
  queryResult?: ChantierIndicateursNonAJour[];
  indicateursDemandes?: IndicateurDemande[];
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
} = {}) => {
  const query = mock<RecupererIndicateursNonAJourQuery>();
  query.execute.mockResolvedValue(queryResult);
  const verifierQuery = mock<VerifierIndicateursDemandesQuery>();
  verifierQuery.execute.mockResolvedValue(indicateursDemandes);
  const tool = createGetIndicateursNonAJourTool({
    recupererIndicateursNonAJourQuery: query,
    verifierIndicateursDemandesQuery: verifierQuery,
  })({ territoiresAccessibles, chantiersAccessibles });
  return { tool, query, verifierQuery };
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

  test("classe les indicateurs demandés et n'interroge la fraîcheur que pour ceux retenus", async () => {
    // Given
    const { tool, query, verifierQuery } = buildTool({
      indicateursDemandes: [
        { id: "IND-001", chantierId: "CH-001", estApplicable: true },
        { id: "IND-002", chantierId: "CH-002", estApplicable: false },
        // Rattaché à un chantier non accessible à l'utilisateur
        { id: "IND-003", chantierId: "CH-003", estApplicable: true },
      ],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_ids: ["IND-001", "IND-002", "IND-003", "IND-404"],
      territoire_code: "DEPT-29",
    });

    // Then
    expect(verifierQuery.execute).toHaveBeenCalledWith({
      indicateurIds: ["IND-001", "IND-002", "IND-003", "IND-404"],
      territoireCodes: ["DEPT-29"],
    });
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["DEPT-29"],
      indicateurIds: ["IND-001"],
      avecDetailTerritoires: true,
    });
    expect(result).toEqual({
      resultats: expect.any(Array),
      indicateurs_introuvables: ["IND-003", "IND-404"],
      indicateurs_non_applicables: ["IND-002"],
      _output_instructions: expect.stringContaining(
        "Ces indicateurs ne sont suivis sur aucun territoire du périmètre interrogé : IND-002.",
      ),
    });
    expect(result._output_instructions).toContain(
      "Ces indicateurs sont introuvables ou ne sont pas accessibles à l'utilisateur : IND-003, IND-404.",
    );
  });

  test("ne révèle pas le chantier d'un indicateur non accessible", async () => {
    // Given
    const { tool } = buildTool({
      indicateursDemandes: [
        { id: "IND-003", chantierId: "CH-003", estApplicable: true },
      ],
    });

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-003"] });

    // Then
    expect(JSON.stringify(result)).not.toContain("CH-003");
  });

  test("signale un indicateur hors des chantiers demandés avec son chantier de rattachement, sans interroger la fraîcheur", async () => {
    // Given
    const { tool, query } = buildTool({
      indicateursDemandes: [
        { id: "IND-002", chantierId: "CH-002", estApplicable: true },
      ],
    });

    // When
    const result = await executeTool(tool, {
      chantier_ids: ["CH-001"],
      indicateur_ids: ["IND-002"],
    });

    // Then
    expect(query.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      resultats: [],
      indicateurs_hors_chantiers_demandes: [
        { indicateur_id: "IND-002", chantier_id: "CH-002" },
      ],
      _output_instructions: expect.stringContaining(
        "Ces indicateurs n'appartiennent pas aux chantiers demandés : IND-002 (CH-002).",
      ),
    });
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

  test("explique un territoire en retard sans date attendue par une périodicité ou un délai de mise à jour non déclaré", async () => {
    // Given
    const { tool } = buildTool();

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-001"] });

    // Then
    expect(result._output_instructions).toContain(
      "miseAJourAttendueDepuis est null alors que dateDerniereValeur est renseignée",
    );
  });
});
