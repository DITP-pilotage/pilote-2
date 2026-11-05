import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetValeursInitialesCiblesManquantesTool,
  getValeursInitialesCiblesManquantesInputSchema,
  type GetValeursInitialesCiblesManquantesOutput,
} from "@/server/albert/tools/getValeursInitialesCiblesManquantes";
import type {
  GetIndicateursSansViVcQuery,
  LigneIndicateurSansViVc,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";

const JALON = getAnneeDateDeBascule(
  new Date(),
  configuration().dateBasculeAffichageValeursAnneePrecedente,
);

const LIGNE_FINISTERE: LigneIndicateurSansViVc = {
  chantierId: "CH-001",
  chantierNom: "Chantier bornes",
  indicateurId: "IND-001",
  indicateurNom: "Nombre de bornes",
  maille: "DEPT",
  territoireCode: "DEPT-29",
  territoireNom: "Finistère",
  territoireNomAffiche: "29 - Finistère",
  viManquante: true,
  vcManquante: true,
  derniereVcConnue: { valeur: 100, jalon: 2024 },
};

const buildTool = ({
  queryResult = [LIGNE_FINISTERE],
  territoiresAccessibles = ["NAT-FR", "REG-53", "DEPT-29", "DEPT-35"],
  chantiersAccessibles = ["CH-001", "CH-002"],
  chantierParIndicateur = { "IND-001": "CH-001", "IND-002": "CH-002" },
}: {
  queryResult?: LigneIndicateurSansViVc[];
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
  chantierParIndicateur?: Record<string, string>;
} = {}) => {
  const query = mock<GetIndicateursSansViVcQuery>();
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
        : ["NAT-FR", "DEPT-29"],
  );
  const tool = createGetValeursInitialesCiblesManquantesTool({
    getIndicateursSansViVcQuery: query,
    getIndicateursIdentiteQuery,
    territoireResolver,
  })({ territoiresAccessibles, chantiersAccessibles });
  return { tool, query };
};

const executeTool = async (
  tool: ReturnType<
    ReturnType<typeof createGetValeursInitialesCiblesManquantesTool>
  >,
  input: {
    chantier_ids?: string[];
    indicateur_ids?: string[];
    perimetre?: Perimetre;
    detail?: "compteurs" | "territoires";
    valeurs?: "vi" | "vc" | "vi_et_vc";
  } = {},
): Promise<GetValeursInitialesCiblesManquantesOutput> =>
  tool.execute!(getValeursInitialesCiblesManquantesInputSchema.parse(input), {
    toolCallId: "test",
    messages: [],
    abortSignal: undefined,
    context: {},
  }) as Promise<GetValeursInitialesCiblesManquantesOutput>;

const resultatsAvecMaille = (maille: object) => [
  {
    chantier: { id: "CH-001", nom: "Chantier bornes" },
    indicateurs: [
      { id: "IND-001", nom: "Nombre de bornes", mailles: [maille] },
    ],
  },
];

const lignesVc = (nombre: number): LigneIndicateurSansViVc[] =>
  Array.from({ length: nombre }, (_, index) => ({
    ...LIGNE_FINISTERE,
    territoireCode: `DEPT-${index}`,
    viManquante: false,
  }));

describe("get_valeurs_initiales_cibles_manquantes", () => {
  test("transmet le jalon par défaut et les valeurs à la query", async () => {
    // given
    const { tool, query } = buildTool();

    // when
    await executeTool(tool, { chantier_ids: ["CH-001"], valeurs: "vc" });

    // then
    expect(query.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001"],
      territoireCodes: ["NAT-FR", "DEPT-29"],
      indicateurIds: undefined,
      jalon: JALON,
      valeurs: "vc",
    });
  });

  test("valeurs vaut vi_et_vc par défaut", async () => {
    // given
    const { tool, query } = buildTool();

    // when
    await executeTool(tool);

    // then
    expect(query.execute).toHaveBeenCalledWith(
      expect.objectContaining({ valeurs: "vi_et_vc" }),
    );
  });

  test("compteurs : un territoire sans VI ni VC compte dans les deux compteurs, sans clé territoires ni dernière VC", async () => {
    // given
    const { tool } = buildTool();

    // when
    const result = await executeTool(tool);

    // then
    expect(result).toEqual({
      jalon: JALON,
      detail: "compteurs",
      resultats: resultatsAvecMaille({
        maille: "départementale",
        nb_territoires_sans_vi: 1,
        nb_territoires_sans_vc: 1,
      }),
    });
  });

  test("valeurs vc : pas de nb_territoires_sans_vi", async () => {
    // given
    const { tool } = buildTool({
      queryResult: [{ ...LIGNE_FINISTERE, viManquante: false }],
    });

    // when
    const result = await executeTool(tool, { valeurs: "vc" });

    // then
    expect(result.resultats).toEqual(
      resultatsAvecMaille({
        maille: "départementale",
        nb_territoires_sans_vc: 1,
      }),
    );
  });

  test("valeurs vi : pas de nb_territoires_sans_vc", async () => {
    // given
    const { tool } = buildTool({
      queryResult: [
        {
          ...LIGNE_FINISTERE,
          vcManquante: false,
          derniereVcConnue: null,
        },
      ],
    });

    // when
    const result = await executeTool(tool, { valeurs: "vi" });

    // then
    expect(result.resultats).toEqual(
      resultatsAvecMaille({
        maille: "départementale",
        nb_territoires_sans_vi: 1,
      }),
    );
  });

  test("détail : valeurs_manquantes pour les deux motifs et derniere_vc_connue { valeur: 100, jalon: 2024 }", async () => {
    // given
    const { tool } = buildTool();

    // when
    const result = await executeTool(tool, { detail: "territoires" });

    // then
    expect(result).toEqual({
      jalon: JALON,
      detail: "territoires",
      resultats: resultatsAvecMaille({
        maille: "départementale",
        nb_territoires_sans_vi: 1,
        nb_territoires_sans_vc: 1,
        territoires: [
          {
            code: "DEPT-29",
            nom: "Finistère",
            valeurs_manquantes: ["valeur initiale", "valeur cible"],
            derniere_vc_connue: { valeur: 100, jalon: 2024 },
          },
        ],
      }),
    });
  });

  test.each([
    { derniereVcConnue: null, attendu: null },
    {
      derniereVcConnue: { valeur: 0, jalon: 2025 },
      attendu: { valeur: 0, jalon: 2025 },
    },
  ])(
    "détail, VC manquante : derniere_vc_connue vaut $attendu",
    async ({ derniereVcConnue, attendu }) => {
      // given
      const { tool } = buildTool({
        queryResult: [
          { ...LIGNE_FINISTERE, viManquante: false, derniereVcConnue },
        ],
      });

      // when
      const result = await executeTool(tool, {
        detail: "territoires",
        valeurs: "vc",
      });

      // then
      expect(result.resultats).toEqual(
        resultatsAvecMaille({
          maille: "départementale",
          nb_territoires_sans_vc: 1,
          territoires: [
            {
              code: "DEPT-29",
              nom: "Finistère",
              valeurs_manquantes: ["valeur cible"],
              derniere_vc_connue: attendu,
            },
          ],
        }),
      );
    },
  );

  test("détail, VI seule manquante : pas de clé derniere_vc_connue", async () => {
    // given
    const { tool } = buildTool({
      queryResult: [
        { ...LIGNE_FINISTERE, vcManquante: false, derniereVcConnue: null },
      ],
    });

    // when
    const result = await executeTool(tool, { detail: "territoires" });

    // then
    expect(result.resultats).toEqual(
      resultatsAvecMaille({
        maille: "départementale",
        nb_territoires_sans_vi: 1,
        nb_territoires_sans_vc: 0,
        territoires: [
          {
            code: "DEPT-29",
            nom: "Finistère",
            valeurs_manquantes: ["valeur initiale"],
          },
        ],
      }),
    );
  });

  test("800 lignes : détail conservé", async () => {
    // given
    const { tool } = buildTool({ queryResult: lignesVc(800) });

    // when
    const result = await executeTool(tool, { detail: "territoires" });

    // then
    expect(result).toMatchObject({ jalon: JALON, detail: "territoires" });
    expect(result).not.toHaveProperty("detail_trop_volumineux");
  });

  test("801 lignes : compteurs et detail_trop_volumineux", async () => {
    // given
    const { tool } = buildTool({ queryResult: lignesVc(801) });

    // when
    const result = await executeTool(tool, { detail: "territoires" });

    // then
    expect(result).toEqual({
      jalon: JALON,
      detail: "compteurs",
      detail_trop_volumineux: true,
      resultats: resultatsAvecMaille({
        maille: "départementale",
        nb_territoires_sans_vi: 0,
        nb_territoires_sans_vc: 801,
      }),
    });
  });

  test("aucune ligne : resultats vide et jalon présent", async () => {
    // given
    const { tool } = buildTool({ queryResult: [] });

    // when
    const result = await executeTool(tool);

    // then
    expect(result).toEqual({
      jalon: JALON,
      detail: "compteurs",
      resultats: [],
    });
  });

  test("acces_refuse : aucun territoire accessible", async () => {
    // given
    const { tool, query } = buildTool({ territoiresAccessibles: [] });

    // when
    const result = await executeTool(tool);

    // then
    expect(result).toEqual({
      jalon: JALON,
      detail: "compteurs",
      resultats: [],
      acces_refuse: true,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("chantiers_non_accessibles : chantier demandé hors périmètre", async () => {
    // given
    const { tool } = buildTool();

    // when
    const result = await executeTool(tool, {
      chantier_ids: ["CH-001", "CH-999"],
    });

    // then
    expect(result.chantiers_non_accessibles).toEqual(["CH-999"]);
  });

  test("indicateurs_non_accessibles : indicateur d'un chantier hors périmètre", async () => {
    // given
    const { tool } = buildTool({
      chantierParIndicateur: { "IND-001": "CH-001", "IND-009": "CH-009" },
    });

    // when
    const result = await executeTool(tool, {
      indicateur_ids: ["IND-001", "IND-009"],
    });

    // then
    expect(result.indicateurs_non_accessibles).toEqual(["IND-009"]);
  });

  test("indicateurs_introuvables : identifiant inconnu", async () => {
    // given
    const { tool } = buildTool();

    // when
    const result = await executeTool(tool, {
      indicateur_ids: ["IND-001", "IND-404"],
    });

    // then
    expect(result.indicateurs_introuvables).toEqual(["IND-404"]);
  });

  test("mailles dans l'ordre nationale, régionale, départementale", async () => {
    // given
    const { tool } = buildTool({
      queryResult: [
        { ...LIGNE_FINISTERE, maille: "DEPT" },
        { ...LIGNE_FINISTERE, maille: "REG", territoireCode: "REG-53" },
        { ...LIGNE_FINISTERE, maille: "NAT", territoireCode: "NAT-FR" },
      ],
    });

    // when
    const result = await executeTool(tool);

    // then
    expect(
      result.resultats[0].indicateurs[0].mailles.map(({ maille }) => maille),
    ).toEqual(["nationale", "régionale", "départementale"]);
  });
});
