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
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";

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

const RESULTATS_RENVOYES = [
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
            maille: "départementale",
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
];

const TOUS_LES_DEPARTEMENTS_BRETONS = ["DEPT-29", "DEPT-35", "DEPT-56"];

const buildTool = ({
  queryResult = QUERY_RESULT,
  territoiresAccessibles = ["NAT-FR", "REG-53", "DEPT-29", "DEPT-35"],
  chantiersAccessibles = ["CH-001", "CH-002"],
  chantierParIndicateur = { "IND-001": "CH-001", "IND-002": "CH-002" },
  territoiresResolus,
}: {
  queryResult?: ChantierIndicateursNonAJour[];
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
  chantierParIndicateur?: Record<string, string>;
  territoiresResolus?: string[];
} = {}) => {
  const query = mock<GetIndicateursNonAJourQuery>();
  query.execute.mockResolvedValue(queryResult);
  const getIndicateursIdentiteQuery = mock<GetIndicateursIdentiteQuery>();
  getIndicateursIdentiteQuery.execute.mockImplementation(
    async ({ indicateurIds = [] } = {}) =>
      indicateurIds.flatMap((indicateurId) => {
        const chantierId = chantierParIndicateur[indicateurId];
        return chantierId
          ? [
              {
                id: indicateurId,
                nom: `Indicateur ${indicateurId}`,
                description: null,
                type_nom: "Impact",
                est_phare: false,
                chantier: { id: chantierId, nom: `Chantier ${chantierId}` },
              },
            ]
          : [];
      }),
  );
  const territoireResolver = mock<TerritoireResolver>();
  territoireResolver.resoudre.mockImplementation(
    async (perimetre: Perimetre) =>
      perimetre.type === "SELECTION"
        ? perimetre.territoire_codes
        : (territoiresResolus ?? []),
  );
  const tool = createGetIndicateursNonAJourTool({
    getIndicateursNonAJourQuery: query,
    getIndicateursIdentiteQuery,
    territoireResolver,
  })({ territoiresAccessibles, chantiersAccessibles });
  return { tool, query, getIndicateursIdentiteQuery, territoireResolver };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetIndicateursNonAJourTool>>,
  input: {
    chantier_ids?: string[];
    indicateur_ids?: string[];
    perimetre?: Perimetre;
    detail?: "compteurs" | "territoires";
  },
): Promise<GetIndicateursNonAJourOutput> =>
  tool.execute!(getIndicateursNonAJourInputSchema.parse(input), {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetIndicateursNonAJourOutput>;

const ACCES_REFUSE = {
  detail: "compteurs",
  resultats: [],
  acces_refuse: true,
};

const TERRITOIRES_ACCESSIBLES = ["NAT-FR", "REG-53", "DEPT-29", "DEPT-35"];

describe("createGetIndicateursNonAJourTool execute", () => {
  describe("mode et restitution", () => {
    test("sans argument, interroge en compteurs tout ce qui est accessible, sans appeler le resolver", async () => {
      // Given
      const { tool, query, territoireResolver, getIndicateursIdentiteQuery } =
        buildTool();

      // When
      const result = await executeTool(tool, {});

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: TERRITOIRES_ACCESSIBLES,
        indicateurIds: undefined,
        avecDetailTerritoires: false,
      });
      expect(territoireResolver.resoudre).not.toHaveBeenCalled();
      expect(getIndicateursIdentiteQuery.execute).not.toHaveBeenCalled();
      expect(result).toEqual({
        detail: "compteurs",
        resultats: RESULTATS_RENVOYES,
      });
    });

    test("sans detail, interroge en compteurs même avec indicateur_ids", async () => {
      // Given
      const { tool, query } = buildTool();

      // When
      await executeTool(tool, { indicateur_ids: ["IND-001"] });

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: TERRITOIRES_ACCESSIBLES,
        indicateurIds: ["IND-001"],
        avecDetailTerritoires: false,
      });
    });

    test("avec detail territoires, interroge en détail même sans indicateur", async () => {
      // Given
      const { tool, query } = buildTool();

      // When
      const result = await executeTool(tool, { detail: "territoires" });

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: TERRITOIRES_ACCESSIBLES,
        indicateurIds: undefined,
        avecDetailTerritoires: true,
      });
      expect(result).toEqual({
        detail: "territoires",
        resultats: RESULTATS_RENVOYES,
      });
    });

    test("en compteurs, n'ajoute pas de clé territoires_en_retard", async () => {
      // Given
      const { tool } = buildTool({
        queryResult: [
          {
            chantier: { id: "CH-001", nom: "Chantier bornes" },
            indicateurs: [
              {
                id: "IND-001",
                nom: "Nombre de bornes",
                periodicite: null,
                delaiDisponibiliteMois: null,
                mailles: [
                  {
                    maille: "NAT",
                    nbTerritoiresEnRetard: 1,
                    nbTerritoiresApplicables: 1,
                  },
                ],
              },
            ],
          },
        ],
      });

      // When
      const result = await executeTool(tool, {});

      // Then
      expect(result).toEqual({
        detail: "compteurs",
        resultats: [
          {
            chantier: { id: "CH-001", nom: "Chantier bornes" },
            indicateurs: [
              {
                id: "IND-001",
                nom: "Nombre de bornes",
                periodicite: null,
                delai_disponibilite_mois: null,
                mailles: [
                  {
                    maille: "nationale",
                    nb_territoires_en_retard: 1,
                    nb_territoires_applicables: 1,
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe("territoires", () => {
    test("refuse un territoire désigné inaccessible", async () => {
      // Given
      const { tool, query } = buildTool();

      // When
      const result = await executeTool(tool, {
        perimetre: { type: "SELECTION", territoire_codes: ["REG-11"] },
      });

      // Then
      expect(result).toEqual(ACCES_REFUSE);
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("une sélection dont un seul code est inaccessible est refusée", async () => {
      // Given
      const { tool, query } = buildTool();

      // When
      const result = await executeTool(tool, {
        perimetre: {
          type: "SELECTION",
          territoire_codes: ["DEPT-29", "REG-11"],
        },
      });

      // Then
      expect(result).toEqual(ACCES_REFUSE);
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("refuse France et ses régions sans accès à NAT-FR", async () => {
      // Given
      const { tool, query } = buildTool({
        territoiresAccessibles: ["REG-53"],
        territoiresResolus: ["NAT-FR", "REG-53"],
      });

      // When
      const result = await executeTool(tool, {
        perimetre: { type: "FRANCE_ET_SES_REGIONS" },
      });

      // Then
      expect(result).toEqual(ACCES_REFUSE);
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("refuse une région et ses départements sans accès à la région", async () => {
      // Given
      const { tool, query } = buildTool({
        territoiresResolus: ["REG-11", "DEPT-75"],
      });

      // When
      const result = await executeTool(tool, {
        perimetre: {
          type: "REGION_ET_SES_DEPARTEMENTS",
          region_code: "REG-11",
        },
      });

      // Then
      expect(result).toEqual(ACCES_REFUSE);
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("ne garde que les départements accessibles d'une région accessible", async () => {
      // Given
      const { tool, query } = buildTool({
        territoiresAccessibles: ["REG-53", "DEPT-29"],
        territoiresResolus: ["REG-53", ...TOUS_LES_DEPARTEMENTS_BRETONS],
      });

      // When
      await executeTool(tool, {
        perimetre: {
          type: "REGION_ET_SES_DEPARTEMENTS",
          region_code: "REG-53",
        },
      });

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: ["REG-53", "DEPT-29"],
        indicateurIds: undefined,
        avecDetailTerritoires: false,
      });
    });

    test("TOUS_DEPARTEMENTS n'exige aucun territoire désigné", async () => {
      // Given
      const { tool, query } = buildTool({
        territoiresAccessibles: ["DEPT-29"],
        territoiresResolus: ["DEPT-29", "DEPT-35"],
      });

      // When
      await executeTool(tool, { perimetre: { type: "TOUS_DEPARTEMENTS" } });

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: ["DEPT-29"],
        indicateurIds: undefined,
        avecDetailTerritoires: false,
      });
    });

    test("refuse TOUS_DEPARTEMENTS sans aucun département accessible", async () => {
      // Given
      const { tool, query } = buildTool({
        territoiresAccessibles: ["REG-53"],
        territoiresResolus: ["DEPT-29", "DEPT-35"],
      });

      // When
      const result = await executeTool(tool, {
        perimetre: { type: "TOUS_DEPARTEMENTS" },
      });

      // Then
      expect(result).toEqual(ACCES_REFUSE);
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("refuse sans aucun territoire accessible", async () => {
      // Given
      const { tool, query } = buildTool({ territoiresAccessibles: [] });

      // When
      const result = await executeTool(tool, {});

      // Then
      expect(result).toEqual(ACCES_REFUSE);
      expect(query.execute).not.toHaveBeenCalled();
    });
  });

  describe("chantiers", () => {
    test("signale les chantiers demandés inaccessibles dans le refus", async () => {
      // Given
      const { tool, query } = buildTool();

      // When
      const result = await executeTool(tool, { chantier_ids: ["CH-999"] });

      // Then
      expect(result).toEqual({
        ...ACCES_REFUSE,
        chantiers_non_accessibles: ["CH-999"],
      });
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("refuse sans aucun chantier accessible", async () => {
      // Given
      const { tool, query } = buildTool({ chantiersAccessibles: [] });

      // When
      const result = await executeTool(tool, {});

      // Then
      expect(result).toEqual(ACCES_REFUSE);
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("ne transmet que les chantiers demandés accessibles et signale les autres", async () => {
      // Given
      const { tool, query } = buildTool({ queryResult: [] });

      // When
      const result = await executeTool(tool, {
        chantier_ids: ["CH-001", "CH-999"],
      });

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001"],
        territoireCodes: TERRITOIRES_ACCESSIBLES,
        indicateurIds: undefined,
        avecDetailTerritoires: false,
      });
      expect(result).toEqual({
        detail: "compteurs",
        resultats: [],
        chantiers_non_accessibles: ["CH-999"],
      });
    });

    test("refuse un chantier inaccessible même avec un indicateur accessible", async () => {
      // Given
      const { tool, query, getIndicateursIdentiteQuery } = buildTool();

      // When
      const result = await executeTool(tool, {
        chantier_ids: ["CH-999"],
        indicateur_ids: ["IND-001"],
      });

      // Then
      expect(result).toEqual({
        ...ACCES_REFUSE,
        chantiers_non_accessibles: ["CH-999"],
      });
      expect(getIndicateursIdentiteQuery.execute).not.toHaveBeenCalled();
      expect(query.execute).not.toHaveBeenCalled();
    });
  });

  describe("indicateurs", () => {
    test("vérifie plusieurs indicateurs en une seule requête d'identité", async () => {
      // Given
      const { tool, getIndicateursIdentiteQuery } = buildTool();

      // When
      await executeTool(tool, { indicateur_ids: ["IND-001", "IND-002"] });

      // Then
      expect(getIndicateursIdentiteQuery.execute).toHaveBeenCalledTimes(1);
      expect(getIndicateursIdentiteQuery.execute).toHaveBeenCalledWith({
        indicateurIds: ["IND-001", "IND-002"],
      });
    });

    test("des indicateurs tous introuvables ne sont pas un refus", async () => {
      // Given
      const { tool, query } = buildTool();

      // When
      const result = await executeTool(tool, { indicateur_ids: ["IND-404"] });

      // Then
      expect(result).toEqual({
        detail: "compteurs",
        resultats: [],
        indicateurs_introuvables: ["IND-404"],
      });
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("refuse quand aucun indicateur n'est interrogeable et qu'un est inaccessible, sans révéler son chantier", async () => {
      // Given
      const { tool, query } = buildTool({
        chantierParIndicateur: { "IND-003": "CH-003" },
      });

      // When
      const result = await executeTool(tool, {
        indicateur_ids: ["IND-003", "IND-404"],
      });

      // Then
      expect(result).toEqual({
        ...ACCES_REFUSE,
        indicateurs_non_accessibles: ["IND-003"],
        indicateurs_introuvables: ["IND-404"],
      });
      expect(query.execute).not.toHaveBeenCalled();
    });

    test("mélange interrogé, inaccessible et introuvable", async () => {
      // Given
      const { tool, query } = buildTool({
        chantierParIndicateur: { "IND-001": "CH-001", "IND-003": "CH-003" },
      });

      // When
      const result = await executeTool(tool, {
        indicateur_ids: ["IND-001", "IND-003", "IND-404"],
      });

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: TERRITOIRES_ACCESSIBLES,
        indicateurIds: ["IND-001"],
        avecDetailTerritoires: false,
      });
      expect(result).toEqual({
        detail: "compteurs",
        resultats: RESULTATS_RENVOYES,
        indicateurs_non_accessibles: ["IND-003"],
        indicateurs_introuvables: ["IND-404"],
      });
    });

    test("un indicateur nommé ajoute son chantier à ceux demandés", async () => {
      // Given
      const { tool, query } = buildTool();

      // When
      await executeTool(tool, {
        chantier_ids: ["CH-001"],
        indicateur_ids: ["IND-002"],
      });

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: TERRITOIRES_ACCESSIBLES,
        indicateurIds: ["IND-002"],
        avecDetailTerritoires: false,
      });
    });

    test("dédoublonne les indicateurs introuvables", async () => {
      // Given
      const { tool } = buildTool();

      // When
      const result = await executeTool(tool, {
        indicateur_ids: ["IND-404", "IND-404"],
      });

      // Then
      expect(result).toEqual({
        detail: "compteurs",
        resultats: [],
        indicateurs_introuvables: ["IND-404"],
      });
    });

    test("dédoublonne les indicateurs interrogés", async () => {
      // Given
      const { tool, query } = buildTool();

      // When
      await executeTool(tool, { indicateur_ids: ["IND-001", "IND-001"] });

      // Then
      expect(query.execute).toHaveBeenCalledWith({
        chantierIds: ["CH-001", "CH-002"],
        territoireCodes: TERRITOIRES_ACCESSIBLES,
        indicateurIds: ["IND-001"],
        avecDetailTerritoires: false,
      });
    });
  });
});
