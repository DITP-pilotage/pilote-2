import { mock } from "vitest-mock-extended";
import {
  createGetHistoriqueIndicateurTool,
  getHistoriqueIndicateurInputSchema,
  type GetHistoriqueIndicateurOutput,
} from "@/server/albert/tools/getHistoriqueIndicateur";
import type { GetIndicateurContexteQuery } from "@/server/chantiers/query/GetIndicateurContexteQuery";
import type { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";

const creerEvenement = (
  overrides: Partial<{
    typeEvenement: string;
    valeur: number | null;
    ordre: number;
    dateValeur: Date;
  }> = {},
): IndicateurTerritoireValeurEvenement =>
  IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
    {
      indicId: "IND-001",
      territoireCode: "DEPT-75",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeEvenement: (overrides.typeEvenement ?? "VALEUR_CREEE") as any,
      typeValeur: "VALEUR_AVANCEMENT",
      dateValeur: overrides.dateValeur ?? new Date("2024-01-01"),
      valeur: overrides.valeur ?? 10,
      donneesComplementaires: undefined,
      idAuteurModification: "user1",
      correlationId: "corr1",
      ordre: overrides.ordre ?? 1,
      dateCreation: new Date("2024-01-01"),
    },
  );

const contexteParDefaut = {
  id: "IND-001",
  nom: "Indicateur test",
  description: null,
  uniteMesure: "%",
  chantier: { id: "CH-001", nom: "Chantier test" },
  mailleNatAgregee: false,
  mailleRegAgregee: false,
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetHistoriqueIndicateurTool>>,
  input: {
    indicateur_id: string;
    territoire_code: string;
    date_debut?: string;
    date_fin?: string;
    type_filtre?: "TOUS" | "PROPOSITIONS";
  },
): Promise<GetHistoriqueIndicateurOutput> =>
  tool.execute!(getHistoriqueIndicateurInputSchema.parse(input), {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetHistoriqueIndicateurOutput>;

describe("createGetHistoriqueIndicateurTool execute", () => {
  it("retourne introuvable quand l'indicateur n'existe pas", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => null,
    });
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      indicateurTerritoireValeurEvenementRepository,
    })();

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-INEXISTANT",
      territoire_code: "DEPT-75",
    });

    // Then
    expect(result).toEqual({
      indicateur: null,
      introuvable: true,
      _output_instructions: expect.any(String),
    });
  });

  it.each([
    ["NAT-FR", "NAT", { mailleNatAgregee: true, mailleRegAgregee: false }],
    ["REG-11", "REG", { mailleNatAgregee: false, mailleRegAgregee: true }],
  ])(
    "bloque l'historique et n'appelle pas le repository quand l'indicateur est agrégé à la maille %s",
    async (territoireCode, _maille, drapeaux) => {
      // Given
      const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
        execute: async () => ({ ...contexteParDefaut, ...drapeaux }),
      });
      const indicateurTerritoireValeurEvenementRepository =
        mock<IndicateurTerritoireValeurEvenementRepository>();
      const tool = createGetHistoriqueIndicateurTool({
        getIndicateurContexteQuery,
        indicateurTerritoireValeurEvenementRepository,
      })();

      // When
      const result = await executeTool(tool, {
        indicateur_id: "IND-001",
        territoire_code: territoireCode,
      });

      // Then
      expect(result).toEqual({
        indicateur: {
          id: "IND-001",
          nom: "Indicateur test",
          unite_mesure: "%",
        },
        territoire_code: territoireCode,
        agrege_bloque: true,
        _output_instructions: expect.any(String),
      });
      expect(
        indicateurTerritoireValeurEvenementRepository.compterHistoriqueParIndicIdEtTerritoireCode,
      ).not.toHaveBeenCalled();
    },
  );

  it("demande une précision de période quand le volume dépasse le seuil sans plage fournie, sans lire les événements", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        compterHistoriqueParIndicIdEtTerritoireCode: async () => 41,
        recupererBornesDatesHistorique: async () => ({
          dateMin: new Date("2020-01-01"),
          dateMax: new Date("2024-06-01"),
        }),
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      indicateurTerritoireValeurEvenementRepository,
    })();

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
    });

    // Then
    expect(result).toEqual({
      indicateur: { id: "IND-001", nom: "Indicateur test", unite_mesure: "%" },
      territoire_code: "DEPT-75",
      besoin_precision: true,
      nombre_evenements: 41,
      date_evenement_la_plus_ancienne: "2020-01-01",
      date_evenement_la_plus_recente: "2024-06-01",
      _output_instructions: expect.any(String),
    });
    expect(
      indicateurTerritoireValeurEvenementRepository.recupererHistoriqueParIndicIdEtTerritoireCode,
    ).not.toHaveBeenCalled();
  });

  it("ne demande pas de précision quand une plage de dates est fournie, même au-dessus du seuil", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const evenement = creerEvenement();
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        compterHistoriqueParIndicIdEtTerritoireCode: async () => 41,
        recupererHistoriqueParIndicIdEtTerritoireCode: async () => [evenement],
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      indicateurTerritoireValeurEvenementRepository,
    })();

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      date_debut: "2024-01-01",
      date_fin: "2024-12-31",
    });

    // Then
    expect(result.besoin_precision).toBeUndefined();
    expect(result.groupes).toBeDefined();
  });

  it("groupe par date_valeur, ordonne par ordre croissant et mappe des libellés humains sans type_evenement brut", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const evenementCree = creerEvenement({
      typeEvenement: "VALEUR_CREEE",
      valeur: 10,
      ordre: 1,
      dateValeur: new Date("2024-01-01"),
    });
    const evenementModifie = creerEvenement({
      typeEvenement: "VALEUR_MODIFIEE",
      valeur: 20,
      ordre: 2,
      dateValeur: new Date("2024-01-01"),
    });
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        compterHistoriqueParIndicIdEtTerritoireCode: async () => 2,
        recupererHistoriqueParIndicIdEtTerritoireCode: async () => [
          evenementModifie,
          evenementCree,
        ],
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      indicateurTerritoireValeurEvenementRepository,
    })();

    // When
    const result = await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
    });

    // Then
    expect(result.groupes).toEqual([
      {
        date_valeur: "2024-01-01",
        evenements: [
          {
            ordre: 1,
            libelle: "→ nouvelle valeur affichée dans PILOTE : 10",
            type_valeur: "VALEUR_AVANCEMENT",
          },
          {
            ordre: 2,
            libelle:
              "import de données par la direction de projet → nouvelle valeur affichée dans PILOTE : 20",
            type_valeur: "VALEUR_AVANCEMENT",
          },
        ],
      },
    ]);
    const libellesJson = JSON.stringify(result.groupes);
    expect(libellesJson).not.toContain("VALEUR_CREEE");
    expect(libellesJson).not.toContain("VALEUR_MODIFIEE");
  });

  it("passe les 9 types PROPOSITION_VALEUR_* au repository quand type_filtre vaut PROPOSITIONS", async () => {
    // Given
    const getIndicateurContexteQuery = mock<GetIndicateurContexteQuery>({
      execute: async () => contexteParDefaut,
    });
    const indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>({
        compterHistoriqueParIndicIdEtTerritoireCode: vi.fn(async () => 0),
        recupererHistoriqueParIndicIdEtTerritoireCode: async () => [],
      });
    const tool = createGetHistoriqueIndicateurTool({
      getIndicateurContexteQuery,
      indicateurTerritoireValeurEvenementRepository,
    })();

    // When
    await executeTool(tool, {
      indicateur_id: "IND-001",
      territoire_code: "DEPT-75",
      type_filtre: "PROPOSITIONS",
    });

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.compterHistoriqueParIndicIdEtTerritoireCode,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        typesEvenement: [
          "PROPOSITION_VALEUR_CREEE",
          "PROPOSITION_VALEUR_MODIFIEE",
          "PROPOSITION_VALEUR_SUPPRIMEE",
          "PROPOSITION_VALEUR_REFUSEE",
          "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
          "PROPOSITION_VALEUR_ACCEPTEE",
          "PROPOSITION_VALEUR_IGNOREE_VALEUR_MODIFIEE",
          "PROPOSITION_VALEUR_IGNOREE_VALEUR_HISTORISEE",
          "PROPOSITION_VALEUR_ACCEPTEE_AVEC_MODIFICATION",
        ],
      }),
    );
  });
});
