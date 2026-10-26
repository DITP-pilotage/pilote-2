import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createSyntheseTerritoireTool,
  syntheseTerritoireInputSchema,
  type SyntheseTerritoireOutput,
} from "@/server/albert/tools/syntheseTerritoire";
import type {
  ChantiersReader,
  ReadChantiersResult,
} from "@/server/albert/services/ChantiersReader";
import type {
  TauxAvancementTerritoireReader,
  TauxAvancementTerritoireResult,
} from "@/server/albert/services/TauxAvancementTerritoireReader";
import type { GetChantiersResult } from "@/server/chantiers/query/GetChantiersQuery";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

const buildTaux = (territoireCode: string): TauxAvancementTerritoireResult => ({
  territoire_code: territoireCode,
  jalon: 2025,
  taux_avancement_global: "50%",
  mediane_repartition: "48%",
  position_mediane: "DANS_LA_MEDIANE",
});

const buildChantiers = (territoireCode: string): GetChantiersResult => ({
  territoire_code: territoireCode,
  territoire_nom: `Nom ${territoireCode}`,
  jalon: 2025,
  chantiers: [],
});

const resultats = (
  liste: GetChantiersResult[],
  restrictedTerritoires: string[] = [],
): ReadChantiersResult => ({
  kind: "resultats",
  resultats: liste,
  restrictedTerritoires,
});

const habilitations = {
  lecture: { territoires: ["REG-53"], chantiers: ["CH-001"] },
} as unknown as Habilitations;

const buildTool = ({
  taux,
  enRetard,
  enDifficulte,
}: {
  taux: TauxAvancementTerritoireResult[];
  enRetard: ReadChantiersResult;
  enDifficulte: ReadChantiersResult;
}) => {
  const tauxAvancementTerritoireReader = mock<TauxAvancementTerritoireReader>();
  tauxAvancementTerritoireReader.execute.mockResolvedValue(taux);
  const chantiersReader = mock<ChantiersReader>();
  chantiersReader.execute.mockImplementation(async (params) =>
    params.view === "en_retard" ? enRetard : enDifficulte,
  );
  const tool = createSyntheseTerritoireTool({
    chantiersReader,
    tauxAvancementTerritoireReader,
  })({ habilitations });
  return { tool, chantiersReader, tauxAvancementTerritoireReader };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createSyntheseTerritoireTool>>,
  territoireCode = "REG-53",
): Promise<SyntheseTerritoireOutput> =>
  tool.execute!(
    syntheseTerritoireInputSchema.parse({
      territoire_code: territoireCode,
      jalon: 2025,
    }),
    { toolCallId: "test", messages: [], abortSignal: undefined, context: {} },
  ) as Promise<SyntheseTerritoireOutput>;

describe("createSyntheseTerritoireTool execute", () => {
  test("rend les trois blocs et le gabarit mono-territoire pour un seul territoire", async () => {
    // Given
    const { tool } = buildTool({
      taux: [buildTaux("REG-53")],
      enRetard: resultats([buildChantiers("REG-53")]),
      enDifficulte: resultats([]),
    });

    // When
    const result = await executeTool(tool);

    // Then
    expect(result).toEqual({
      taux_avancement: [buildTaux("REG-53")],
      chantiers_en_retard: [buildChantiers("REG-53")],
      chantiers_en_difficulte: [],
      _output_instructions: expect.stringContaining("# Synthèse pour"),
    });
    expect(result._output_instructions).not.toContain("# Comparaison");
  });

  test("choisit le gabarit comparaison pour plusieurs territoires", async () => {
    // Given
    const { tool } = buildTool({
      taux: [buildTaux("REG-53"), buildTaux("DEPT-29")],
      enRetard: resultats([]),
      enDifficulte: resultats([]),
    });

    // When
    const result = await executeTool(tool);

    // Then
    expect(result._output_instructions).toContain("# Comparaison");
    expect(result._output_instructions).not.toContain("# Synthèse pour");
  });

  test("propage la non-applicabilité du retard en rendant les deux autres blocs", async () => {
    // Given
    const { tool } = buildTool({
      taux: [buildTaux("NAT-FR")],
      enRetard: { kind: "notApplicable", raison: "raison" },
      enDifficulte: resultats([buildChantiers("NAT-FR")]),
    });

    // When
    const result = await executeTool(tool, "NAT-FR");

    // Then
    expect(result).toEqual({
      taux_avancement: [buildTaux("NAT-FR")],
      chantiers_en_retard: [],
      chantiers_en_difficulte: [buildChantiers("NAT-FR")],
      non_applicable_en_retard: { raison: "raison" },
      _output_instructions: expect.stringContaining(
        "non_applicable_en_retard.raison",
      ),
    });
  });

  test("ne restitue aucune donnée quand l'utilisateur n'a accès à aucun chantier", async () => {
    // Given
    const { tool } = buildTool({
      taux: [buildTaux("REG-53")],
      enRetard: { kind: "noChantierAccessible" },
      enDifficulte: { kind: "noChantierAccessible" },
    });

    // When
    const result = await executeTool(tool);

    // Then
    expect(result).toEqual({
      taux_avancement: [],
      chantiers_en_retard: [],
      chantiers_en_difficulte: [],
      _output_instructions:
        "L'utilisateur n'a accès à aucun chantier : aucune donnée ne peut être restituée.",
    });
  });

  test("préfixe l'avertissement de restriction avec l'union des territoires restreints", async () => {
    // Given
    const { tool } = buildTool({
      taux: [buildTaux("REG-52")],
      enRetard: resultats([], ["REG-52"]),
      enDifficulte: resultats([], ["REG-52", "DEPT-44"]),
    });

    // When
    const result = await executeTool(tool, "REG-52");

    // Then
    expect(
      result._output_instructions.startsWith(
        "⚠️ Restriction d'accès — territoires REG-52, DEPT-44",
      ),
    ).toBe(true);
  });

  test("lit les deux vues sur le même périmètre avec l'accès de l'utilisateur", async () => {
    // Given
    const { tool, chantiersReader, tauxAvancementTerritoireReader } = buildTool(
      {
        taux: [buildTaux("REG-53")],
        enRetard: resultats([]),
        enDifficulte: resultats([]),
      },
    );
    const perimetre = {
      territoireCode: "REG-53",
      jalon: 2025,
      includeSousTerritoires: false,
    };
    const access = {
      territoiresAccessibles: ["REG-53"],
      chantiersAccessibles: ["CH-001"],
    };

    // When
    await executeTool(tool);

    // Then
    expect(chantiersReader.execute.mock.calls).toEqual([
      [{ ...perimetre, view: "en_retard" }, access],
      [{ ...perimetre, view: "en_difficulte" }, access],
    ]);
    expect(tauxAvancementTerritoireReader.execute).toHaveBeenCalledWith(
      perimetre,
      habilitations,
    );
  });
});
