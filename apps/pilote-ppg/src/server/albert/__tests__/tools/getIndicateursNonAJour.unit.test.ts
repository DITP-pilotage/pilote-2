import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetIndicateursNonAJourTool,
  type GetIndicateursNonAJourOutput,
} from "@/server/albert/tools/getIndicateursNonAJour";
import type {
  RecupererIndicateursNonAJourQuery,
  RecupererIndicateursNonAJourResult,
} from "@/server/chantiers/infrastructure/queries/RecupererIndicateursNonAJourQuery";

const QUERY_RESULT: RecupererIndicateursNonAJourResult = {
  chantiers: [
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
  ],
  indicateursApplicablesIds: ["IND-001"],
};

const buildTool = ({
  queryResult = QUERY_RESULT,
  territoiresAccessibles = ["NAT-FR", "DEPT-29", "DEPT-35"],
  chantiersAccessibles = ["CH-001", "CH-002"],
}: {
  queryResult?: RecupererIndicateursNonAJourResult;
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
} = {}) => {
  const query = mock<RecupererIndicateursNonAJourQuery>();
  query.execute.mockResolvedValue(queryResult);
  const tool = createGetIndicateursNonAJourTool({
    recupererIndicateursNonAJourQuery: query,
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

  test("sans argument, borne la query aux chantiers et territoires accessibles et ne renvoie que les compteurs", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: undefined,
    });
    expect(result).toEqual({
      resultats: [
        {
          chantier: { id: "CH-001", nom: "Chantier bornes" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              periodicite: "Trimestrielle",
              delai_disponibilite_mois: 1,
              mailles: [
                {
                  maille: "DEPT",
                  nb_territoires_en_retard: 1,
                  nb_territoires_applicables: 3,
                },
              ],
            },
          ],
        },
      ],
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
    });
  });

  test("avec indicateur_ids, renvoie le détail des territoires en retard", async () => {
    // Given
    const { tool } = buildTool();

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-001"] });

    // Then
    expect(result).toEqual({
      resultats: [
        {
          chantier: { id: "CH-001", nom: "Chantier bornes" },
          indicateurs: [
            {
              id: "IND-001",
              nom: "Nombre de bornes",
              periodicite: "Trimestrielle",
              delai_disponibilite_mois: 1,
              mailles: [
                {
                  maille: "DEPT",
                  nb_territoires_en_retard: 1,
                  nb_territoires_applicables: 3,
                  territoires_en_retard: [
                    {
                      code: "DEPT-29",
                      nom: "Finistère",
                      date_derniere_valeur: "2026-01-01",
                      mise_a_jour_attendue_depuis: "2026-05-31",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
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
    });
    expect(result._output_instructions).toContain(
      "Liste les territoires en retard",
    );
  });

  test("signale les indicateurs demandés qui ne sont suivis sur aucun territoire du périmètre", async () => {
    // Given
    const { tool } = buildTool({
      queryResult: { chantiers: [], indicateursApplicablesIds: ["IND-001"] },
    });

    // When
    const result = await executeTool(tool, {
      indicateur_ids: ["IND-001", "IND-002"],
      territoire_code: "DEPT-29",
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      indicateurs_non_suivis: ["IND-002"],
      _output_instructions: expect.stringContaining("IND-002"),
    });
  });

  test("signale les chantiers demandés non accessibles pour ne pas les présenter comme à jour", async () => {
    // Given
    const { tool } = buildTool({
      queryResult: { chantiers: [], indicateursApplicablesIds: [] },
    });

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
      "mise_a_jour_attendue_depuis est null alors que date_derniere_valeur est renseignée",
    );
  });

  test("présente un indicateur absent du périmètre comme non suivi ou non accessible", async () => {
    // Given
    const { tool } = buildTool({
      queryResult: { chantiers: [], indicateursApplicablesIds: [] },
    });

    // When
    const result = await executeTool(tool, { indicateur_ids: ["IND-002"] });

    // Then
    expect(result._output_instructions).toContain(
      "Ces indicateurs ne sont pas suivis, ou pas accessibles, sur le périmètre interrogé : IND-002.",
    );
  });
});
