import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  ChantiersReader,
  NON_APPLICABLE_EN_RETARD_NAT_FR,
  type AccessScope,
  type ReadChantiersParams,
} from "@/server/albert/services/ChantiersReader";
import type {
  GetChantiersQuery,
  GetChantiersResult,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const buildResultat = (territoireCode: string): GetChantiersResult => ({
  territoire_code: territoireCode,
  territoire_nom: `Nom ${territoireCode}`,
  jalon: 2025,
  chantiers: [
    {
      chantier: {
        id: "CH-001",
        nom: "Chantier 1",
        axe: "Axe",
        ppg: "PPG",
        ministeres: [],
        mailles_applicables: ["NAT", "REG"],
      },
      meteo: "SOLEIL",
      tendance: "HAUSSE",
      ecart: -12,
      taux_avancement: 40,
      est_en_retard: true,
      est_en_difficulte: false,
      synthese: {
        meteo: "SOLEIL",
        commentaire: "texte",
        date_meteo: "2025-01-01",
        date_commentaire: "2025-01-01",
      },
      commentaires: {
        donnees: { contenu: "commentaire", date: "2025-01-01" },
        autresResultats: null,
      },
    },
  ],
});

const buildReader = (codesResolus: string[]) => {
  const getChantiersQuery = mock<GetChantiersQuery>();
  getChantiersQuery.execute.mockImplementation(async (params) =>
    buildResultat(params.territoireCode),
  );
  const territoireResolver = mock<TerritoireResolver>();
  territoireResolver.resoudre.mockResolvedValue(codesResolus);

  return {
    reader: new ChantiersReader({ getChantiersQuery, territoireResolver }),
    getChantiersQuery,
  };
};

const params = (
  overrides: Partial<ReadChantiersParams>,
): ReadChantiersParams => ({
  territoireCode: "REG-53",
  jalon: 2025,
  includeSousTerritoires: false,
  ...overrides,
});

const accesComplet: AccessScope = {
  territoiresAccessibles: ["NAT-FR", "REG-53"],
  chantiersAccessibles: ["CH-001", "CH-002"],
};

describe("ChantiersReader", () => {
  test("rend notApplicable pour la vue en_retard au national sans sous-territoires", async () => {
    // Given
    const { reader, getChantiersQuery } = buildReader(["NAT-FR"]);

    // When
    const result = await reader.execute(
      params({ territoireCode: "NAT-FR", view: "en_retard" }),
      accesComplet,
    );

    // Then
    expect(result).toEqual({
      kind: "notApplicable",
      raison: NON_APPLICABLE_EN_RETARD_NAT_FR,
    });
    expect(getChantiersQuery.execute).not.toHaveBeenCalled();
  });

  test("interroge la query pour la vue en_retard au national avec sous-territoires", async () => {
    // Given
    const { reader, getChantiersQuery } = buildReader(["NAT-FR", "REG-53"]);

    // When
    const result = await reader.execute(
      params({
        territoireCode: "NAT-FR",
        view: "en_retard",
        includeSousTerritoires: true,
      }),
      accesComplet,
    );

    // Then
    expect(result).toEqual({
      kind: "resultats",
      resultats: [buildResultat("NAT-FR"), buildResultat("REG-53")],
      restrictedTerritoires: [],
    });
    expect(getChantiersQuery.execute).toHaveBeenCalledTimes(2);
  });

  test("rend requestedChantiersNotAccessible quand aucun chantier demandé n'est accessible", async () => {
    // Given
    const { reader, getChantiersQuery } = buildReader(["REG-53"]);

    // When
    const result = await reader.execute(params({ chantierIds: ["CH-003"] }), {
      ...accesComplet,
      chantiersAccessibles: ["CH-002"],
    });

    // Then
    expect(result).toEqual({ kind: "requestedChantiersNotAccessible" });
    expect(getChantiersQuery.execute).not.toHaveBeenCalled();
  });

  test("rend noChantierAccessible sans interroger la query quand l'utilisateur n'a accès à aucun chantier", async () => {
    // Given
    const { reader, getChantiersQuery } = buildReader(["REG-53"]);

    // When
    const result = await reader.execute(params({}), {
      ...accesComplet,
      chantiersAccessibles: [],
    });

    // Then
    expect(result).toEqual({ kind: "noChantierAccessible" });
    expect(getChantiersQuery.execute).not.toHaveBeenCalled();
  });

  test("sans chantierIds, ne passe à la query que les chantiers accessibles", async () => {
    // Given
    const { reader, getChantiersQuery } = buildReader(["REG-53"]);

    // When
    await reader.execute(params({ view: "en_difficulte" }), accesComplet);

    // Then
    expect(getChantiersQuery.execute).toHaveBeenCalledWith({
      territoireCode: "REG-53",
      jalon: 2025,
      chantierIds: ["CH-001", "CH-002"],
      view: "en_difficulte",
      tendance: undefined,
      meteo: undefined,
    });
  });

  test("ne passe à la query que les chantiers accessibles et les filtres", async () => {
    // Given
    const { reader, getChantiersQuery } = buildReader(["REG-53"]);

    // When
    await reader.execute(
      params({
        chantierIds: ["CH-001", "CH-003"],
        view: "en_difficulte",
        tendance: "BAISSE",
        meteo: "ORAGE",
      }),
      accesComplet,
    );

    // Then
    expect(getChantiersQuery.execute).toHaveBeenCalledWith({
      territoireCode: "REG-53",
      jalon: 2025,
      chantierIds: ["CH-001"],
      view: "en_difficulte",
      tendance: "BAISSE",
      meteo: "ORAGE",
    });
  });

  test("masque les données d'un territoire hors périmètre et le liste dans restrictedTerritoires", async () => {
    // Given
    const { reader } = buildReader(["REG-53", "REG-52"]);
    const resultatComplet = buildResultat("REG-52");
    const chantierComplet = resultatComplet.chantiers[0];

    // When
    const result = await reader.execute(
      params({ includeSousTerritoires: true }),
      accesComplet,
    );

    // Then
    expect(result).toEqual({
      kind: "resultats",
      resultats: [
        buildResultat("REG-53"),
        {
          ...resultatComplet,
          chantiers: [
            {
              ...chantierComplet,
              tendance: null,
              est_en_retard: false,
              est_en_difficulte: false,
              synthese: {
                meteo: "SOLEIL",
                commentaire: null,
                date_meteo: "2025-01-01",
                date_commentaire: null,
              },
              commentaires: { donnees: null, autresResultats: null },
            },
          ],
        },
      ],
      restrictedTerritoires: ["REG-52"],
    });
  });
});
