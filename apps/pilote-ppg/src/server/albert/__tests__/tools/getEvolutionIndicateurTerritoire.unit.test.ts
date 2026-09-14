import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetEvolutionIndicateurTerritoireTool,
  type GetEvolutionIndicateurTerritoireOutput,
} from "@/server/albert/tools/getEvolutionIndicateurTerritoire";
import type { RecupererEvolutionValeursAvancementTerritoiresQuery } from "@/server/chantiers/infrastructure/queries/RecupererEvolutionValeursAvancementTerritoiresQuery";
import type { RecupererChantierIdParIndicateurIdQuery } from "@/server/chantiers/query/RecupererChantierIdParIndicateurIdQuery";
import type { Habilitations } from "@/server/domain/utilisateur/habilitation/Habilitation.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

const buildHabilitations = (chantiers: string[]): Habilitations => ({
  lecture: { chantiers, territoires: [], périmètres: [] },
  saisieCommentaire: { chantiers: [], territoires: [], périmètres: [] },
  saisieIndicateur: { chantiers: [], territoires: [], périmètres: [] },
  responsabilite: { chantiers: [], territoires: [], périmètres: [] },
  gestionUtilisateur: { chantiers: [], territoires: [], périmètres: [] },
});

const resultatAvecDeuxTerritoires = {
  territoires: [
    {
      territoireCode: "DEPT-75",
      historiquesValeurs: [
        { date: "2024-05-01", valeur: 18 },
        { date: "2024-12-01", valeur: 23 },
      ],
    },
    {
      territoireCode: "DEPT-93",
      historiquesValeurs: [{ date: "2024-05-01", valeur: 5 }],
    },
  ],
};

const buildTool = ({
  queryResult,
  chantierIdResolu,
  chantiersAccessibles,
}: {
  queryResult: Awaited<
    ReturnType<RecupererEvolutionValeursAvancementTerritoiresQuery["execute"]>
  >;
  chantierIdResolu: string | null;
  chantiersAccessibles: string[];
}) => {
  const query = mock<RecupererEvolutionValeursAvancementTerritoiresQuery>({
    execute: vi.fn(async () => queryResult),
  });
  const chantierIdQuery = mock<RecupererChantierIdParIndicateurIdQuery>({
    execute: vi.fn(async () => chantierIdResolu),
  });
  return {
    tool: createGetEvolutionIndicateurTerritoireTool({
      recupererEvolutionValeursAvancementTerritoiresQuery: query,
      recupererChantierIdParIndicateurIdQuery: chantierIdQuery,
    })({
      chantiersAccessibles,
      habilitations: buildHabilitations(chantiersAccessibles),
      profil: ProfilEnum.DITP_ADMIN,
    }),
    query,
    chantierIdQuery,
  };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetEvolutionIndicateurTerritoireTool>>,
  input: {
    indicateur_id: string;
    territoire_code: string;
    jalon: number;
  },
): Promise<GetEvolutionIndicateurTerritoireOutput> =>
  tool.execute!(input, {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetEvolutionIndicateurTerritoireOutput>;

describe("createGetEvolutionIndicateurTerritoireTool execute", () => {
  test("retourne les points d'évolution du territoire demandé", async () => {
    // Given
    const { tool } = buildTool({
      queryResult: resultatAvecDeuxTerritoires,
      chantierIdResolu: "CH-001",
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      jalon: 2024,
    });

    // Then
    expect(result).toEqual({
      territoire_code: "DEPT-75",
      jalon: 2024,
      points: [
        { date: "2024-05-01", valeur: 18 },
        { date: "2024-12-01", valeur: 23 },
      ],
      _output_instructions: expect.any(String),
    });
  });

  test("résout le chantier_id depuis l'indicateur_id sans que le LLM ait à le fournir", async () => {
    // Given
    const { tool, query, chantierIdQuery } = buildTool({
      queryResult: resultatAvecDeuxTerritoires,
      chantierIdResolu: "CH-001",
      chantiersAccessibles: ["CH-001"],
    });

    // When
    await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      jalon: 2024,
    });

    // Then
    expect(chantierIdQuery.execute).toHaveBeenCalledWith("IND-001");
    expect(query.execute).toHaveBeenCalledWith({
      indicateurId: "IND-001",
      chantierId: "CH-001",
      jalon: 2024,
      habilitations: buildHabilitations(["CH-001"]),
      profil: ProfilEnum.DITP_ADMIN,
    });
  });

  test("lève une erreur si l'indicateur est inconnu", async () => {
    // Given
    const { tool } = buildTool({
      queryResult: resultatAvecDeuxTerritoires,
      chantierIdResolu: null,
      chantiersAccessibles: ["CH-001"],
    });

    // When / Then
    await expect(
      executeTool(tool, {
        indicateur_id: "IND-INCONNU",
        territoire_code: "DEPT-75",
        jalon: 2024,
      }),
    ).rejects.toThrow("Indicateur inconnu : IND-INCONNU");
  });

  test("lève une erreur si le chantier rattaché à l'indicateur n'est pas accessible", async () => {
    // Given
    const { tool } = buildTool({
      queryResult: resultatAvecDeuxTerritoires,
      chantierIdResolu: "CH-002",
      chantiersAccessibles: ["CH-001"],
    });

    // When / Then
    await expect(
      executeTool(tool, {
        indicateur_id: "IND-001",
        territoire_code: "DEPT-75",
        jalon: 2024,
      }),
    ).rejects.toThrow("Accès non autorisé au chantier CH-002");
  });

  test("retourne une liste de points vide quand le territoire n'a pas de données", async () => {
    // Given
    const { tool } = buildTool({
      queryResult: resultatAvecDeuxTerritoires,
      chantierIdResolu: "CH-001",
      chantiersAccessibles: ["CH-001"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-77",
      jalon: 2024,
    });

    // Then
    expect(result).toEqual({
      territoire_code: "DEPT-77",
      jalon: 2024,
      points: [],
      _output_instructions: expect.any(String),
    });
  });
});
