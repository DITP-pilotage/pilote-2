import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetIndicateursSansViVcTool,
  getIndicateursSansViVcInputSchema,
  type GetIndicateursSansViVcOutput,
} from "@/server/albert/tools/getIndicateursSansViVc";
import type {
  ChantierIndicateursSansViVc,
  GetIndicateursSansViVcQuery,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";

const QUERY_RESULT: ChantierIndicateursSansViVc[] = [
  {
    chantier: { id: "CH-001", nom: "Chantier bornes" },
    indicateurs: [
      {
        id: "IND-001",
        nom: "Nombre de bornes",
        mailles: [
          {
            maille: "DEPT",
            nbTerritoiresSansVi: 1,
            nbTerritoiresSansVc: 0,
            nbTerritoiresApplicables: 3,
          },
        ],
      },
    ],
  },
];

const JALON_DE_BASCULE = getAnneeDateDeBascule(
  new Date(),
  configuration().dateBasculeAffichageValeursAnneePrecedente,
);

const buildTool = () => {
  const query = mock<GetIndicateursSansViVcQuery>();
  query.execute.mockResolvedValue(QUERY_RESULT);
  const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>();
  getIndicateurContexteQuery.execute.mockImplementation(
    async ({ indicateurId }) => ({
      id: indicateurId,
      nom: `Indicateur ${indicateurId}`,
      description: null,
      uniteMesure: null,
      chantier: { id: "CH-001", nom: "Chantier CH-001" },
      mailleNatAgregee: false,
      mailleRegAgregee: false,
      parametrageValeurAffichee: null,
    }),
  );
  const tool = createGetIndicateursSansViVcTool({
    getIndicateursSansViVcQuery: query,
    getIndicateurContexteQuery,
  })({
    territoiresAccessibles: ["NAT-FR", "DEPT-29", "DEPT-35"],
    chantiersAccessibles: ["CH-001", "CH-002"],
  });
  return { tool, query };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetIndicateursSansViVcTool>>,
  input: {
    chantier_ids?: string[];
    indicateur_ids?: string[];
    territoire_code?: string;
    missing?: "vi" | "vc" | "vi_or_vc";
  },
): Promise<GetIndicateursSansViVcOutput> =>
  tool.execute!(getIndicateursSansViVcInputSchema.parse(input), {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetIndicateursSansViVcOutput>;

describe("createGetIndicateursSansViVcTool execute", () => {
  test("sans argument, interroge les chantiers et territoires accessibles au jalon de bascule, pour les VI ou VC manquantes, sans détail", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, {});

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: undefined,
      jalon: JALON_DE_BASCULE,
      missing: "vi_or_vc",
      withTerritoiresDetail: false,
    });
    expect(result).toEqual({
      jalon: JALON_DE_BASCULE,
      resultats: QUERY_RESULT,
    });
  });

  test("transmet la valeur manquante demandée et le détail avec indicateur_ids", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    await executeTool(tool, { indicateur_ids: ["IND-001"], missing: "vc" });

    // Then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002"],
      territoireCodes: ["NAT-FR", "DEPT-29", "DEPT-35"],
      indicateurIds: ["IND-001"],
      jalon: JALON_DE_BASCULE,
      missing: "vc",
      withTerritoiresDetail: true,
    });
  });

  test("signale un accès refusé avec le jalon, sans appeler la query", async () => {
    // Given
    const { tool, query } = buildTool();

    // When
    const result = await executeTool(tool, { territoire_code: "DEPT-75" });

    // Then
    expect(query.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      jalon: JALON_DE_BASCULE,
      resultats: [],
      acces_refuse: true,
    });
  });
});
