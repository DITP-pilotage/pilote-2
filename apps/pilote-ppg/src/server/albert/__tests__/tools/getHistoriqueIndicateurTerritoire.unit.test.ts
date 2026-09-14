import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetHistoriqueIndicateurTerritoireTool,
  type GetHistoriqueIndicateurTerritoireOutput,
} from "@/server/albert/tools/getHistoriqueIndicateurTerritoire";
import type { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";

const construireEvenement = () =>
  IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
    {
      id: "1",
      indicId: "IND-001",
      territoireCode: "DEPT-75",
      typeEvenement: "VALEUR_CREEE",
      typeValeur: "VALEUR_AVANCEMENT",
      dateValeur: new Date("2024-05-01"),
      valeur: 18,
      donneesComplementaires: undefined,
      idAuteurModification: "AUTEUR-1",
      correlationId: "CORR-1",
      ordre: 1,
      dateCreation: new Date("2024-05-01T10:00:00.000Z"),
    },
  );

const buildTool = ({
  evenements,
  territoiresAccessibles,
}: {
  evenements: IndicateurTerritoireValeurEvenement[];
  territoiresAccessibles: string[];
}) => {
  const repository = mock<IndicateurTerritoireValeurEvenementRepository>({
    recupererHistoriqueParIndicIdEtTerritoireCode: vi.fn(
      async () => evenements,
    ),
  });
  return {
    tool: createGetHistoriqueIndicateurTerritoireTool({
      indicateurTerritoireValeurEvenementRepository: repository,
    })({ territoiresAccessibles }),
    repository,
  };
};

const executeTool = async (
  tool: ReturnType<
    ReturnType<typeof createGetHistoriqueIndicateurTerritoireTool>
  >,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
): Promise<GetHistoriqueIndicateurTerritoireOutput> =>
  tool.execute!(input, {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetHistoriqueIndicateurTerritoireOutput>;

describe("createGetHistoriqueIndicateurTerritoireTool execute", () => {
  test("retourne les événements traduits pour le territoire demandé", async () => {
    // Given
    const { tool } = buildTool({
      evenements: [construireEvenement()],
      territoiresAccessibles: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      perimetre: "tout",
    });

    // Then
    expect(result).toEqual({
      territoire_code: "DEPT-75",
      evenements: [
        {
          dateValeur: "2024-05-01",
          dateCreation: "2024-05-01T10:00:00.000Z",
          libelle: "Nouvelle valeur affichée dans PILOTE : 18",
        },
      ],
      _output_instructions: expect.any(String),
    });
  });

  test("applique le périmètre par défaut valeur_affichee quand non précisé", async () => {
    // Given
    const { tool } = buildTool({
      evenements: [construireEvenement()],
      territoiresAccessibles: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
    });

    // Then — VALEUR_CREEE fait partie du périmètre valeur_affichee
    expect(result.evenements).toHaveLength(1);
  });

  test("transmet indicateur_id et territoire_code au repository", async () => {
    // Given
    const { tool, repository } = buildTool({
      evenements: [],
      territoiresAccessibles: ["DEPT-75"],
    });

    // When
    await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      perimetre: "tout",
    });

    // Then
    expect(
      repository.recupererHistoriqueParIndicIdEtTerritoireCode,
    ).toHaveBeenCalledWith({
      indicId: "IND-001",
      territoireCode: "DEPT-75",
    });
  });

  test("lève une erreur si le territoire n'est pas accessible", async () => {
    // Given
    const { tool } = buildTool({
      evenements: [construireEvenement()],
      territoiresAccessibles: ["DEPT-93"],
    });

    // When / Then
    await expect(
      executeTool(tool, {
        indicateur_id: "IND-001",
        territoire_code: "DEPT-75",
        perimetre: "tout",
      }),
    ).rejects.toThrow("Accès non autorisé au territoire DEPT-75");
  });
});
