import type { ModelMessage } from "ai";
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetIndicateursACompleterTool,
  getIndicateursACompleterInputSchema,
  indicateursACompleterVersModele,
  type GetIndicateursACompleterOutput,
} from "@/server/albert/tools/getIndicateursACompleter";
import type {
  GetIndicateursNonAJourQuery,
  LigneIndicateurNonAJour,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
import type {
  GetIndicateursSansViVcQuery,
  LigneIndicateurSansViVc,
} from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";
import type { GetIndicateursIdentiteQuery } from "@/server/chantiers/query/GetIndicateursIdentiteQuery";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { configuration } from "@/config";

const JALON = getAnneeDateDeBascule(
  new Date(),
  configuration().dateBasculeAffichageValeursAnneePrecedente,
);

const LIGNE_VA: LigneIndicateurNonAJour = {
  chantierId: "CH-001",
  chantierNom: "Chantier bornes",
  indicateurId: "IND-001",
  indicateurNom: "Nombre de bornes",
  periodicite: "MENSUELLE",
  delaiDisponibiliteMois: 1,
  maille: "DEPT",
  territoireCode: "DEPT-29",
  territoireNom: "Finistère",
  territoireNomAffiche: "29 - Finistère",
  dateDerniereValeur: "2025-01-31",
  miseAJourAttendueDepuis: "2025-03-01",
};

const LIGNE_VI_VC: LigneIndicateurSansViVc = {
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

const MESSAGE_SANS_TYPE: ModelMessage[] = [
  {
    role: "user",
    content: "Quels indicateurs sont non à jour sur le CH-018 ?",
  },
];

const MESSAGE_AVEC_TYPES: ModelMessage[] = [
  { role: "user", content: "Quelles VA et VC ne sont pas à jour ?" },
];

const buildTool = ({
  lignesVa = [LIGNE_VA],
  lignesViVc = [LIGNE_VI_VC],
  territoiresAccessibles = ["NAT-FR", "REG-53", "DEPT-29", "DEPT-35"],
  chantiersAccessibles = ["CH-001", "CH-002", "CH-018"],
  chantierParIndicateur = { "IND-001": "CH-001", "IND-894": "CH-018" },
}: {
  lignesVa?: LigneIndicateurNonAJour[];
  lignesViVc?: LigneIndicateurSansViVc[];
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
  chantierParIndicateur?: Record<string, string>;
} = {}) => {
  const queryVa = mock<GetIndicateursNonAJourQuery>();
  queryVa.execute.mockResolvedValue(lignesVa);
  const queryViVc = mock<GetIndicateursSansViVcQuery>();
  queryViVc.execute.mockResolvedValue(lignesViVc);
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
  const getTerritoiresIdentiteQuery = mock<GetTerritoiresIdentiteQuery>();
  getTerritoiresIdentiteQuery.execute.mockResolvedValue([
    { code: "REG-53", nom: "Bretagne", maille: "REG", code_parent: "NAT-FR" },
    {
      code: "DEPT-29",
      nom: "Finistère",
      maille: "DEPT",
      code_parent: "REG-53",
    },
  ]);
  const territoireResolver = mock<TerritoireResolver>();
  territoireResolver.resoudre.mockImplementation(
    async (perimetre: Perimetre) =>
      perimetre.type === "SELECTION"
        ? perimetre.territoire_codes
        : perimetre.type === "REGION_ET_SES_DEPARTEMENTS"
          ? ["REG-53", "DEPT-29"]
          : ["NAT-FR", "DEPT-29"],
  );
  const tool = createGetIndicateursACompleterTool({
    getIndicateursNonAJourQuery: queryVa,
    getIndicateursSansViVcQuery: queryViVc,
    getIndicateursIdentiteQuery,
    getTerritoiresIdentiteQuery,
    territoireResolver,
  })({ territoiresAccessibles, chantiersAccessibles });
  return { tool, queryVa, queryViVc };
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetIndicateursACompleterTool>>,
  {
    messages,
    ...input
  }: {
    messages: ModelMessage[];
    motifs: ("va" | "vi" | "vc")[];
    chantier_ids?: string[];
    indicateur_ids?: string[];
    perimetre?: Perimetre;
  },
): Promise<GetIndicateursACompleterOutput> =>
  tool.execute!(getIndicateursACompleterInputSchema.parse(input), {
    toolCallId: "appel-1",
    messages,
    abortSignal: undefined,
    context: {},
  }) as Promise<GetIndicateursACompleterOutput>;

describe("get_indicateurs_a_completer", () => {
  test("demande la précision quand le type de valeurs n'est pas établi", async () => {
    // given
    const { tool, queryVa, queryViVc } = buildTool();

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_SANS_TYPE,
      motifs: ["va", "vi", "vc"],
      chantier_ids: ["CH-018"],
    });

    // then
    expect(result).toEqual({
      clarification: {
        question: "Quelles valeurs voulez-vous vérifier sur le CH-018 ?",
        choices: [
          {
            label: "Valeurs d'avancement non à jour sur le CH-018",
            value: "Valeurs d'avancement non à jour sur le CH-018",
          },
          {
            label: "Valeurs initiales et cibles manquantes sur le CH-018",
            value: "Valeurs initiales et cibles manquantes sur le CH-018",
          },
          {
            label:
              "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes sur le CH-018",
            value:
              "Valeurs d'avancement non à jour, valeurs initiales et cibles manquantes sur le CH-018",
          },
        ],
      },
    });
    expect(queryVa.execute).not.toHaveBeenCalled();
    expect(queryViVc.execute).not.toHaveBeenCalled();
  });

  test("accès refusé : les champs d'accès seuls, sans clarification", async () => {
    // given
    const { tool } = buildTool({ territoiresAccessibles: ["DEPT-35"] });

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_SANS_TYPE,
      motifs: ["va", "vi", "vc"],
      perimetre: { type: "SELECTION", territoire_codes: ["DEPT-29"] },
    });

    // then
    expect(result).toEqual({ acces_refuse: true });
  });

  test("types nommés : motifs dédoublonnés et ordonnés, lignes fusionnées", async () => {
    // given
    const { tool } = buildTool();

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_AVEC_TYPES,
      motifs: ["vc", "va", "va"],
    });

    // then
    expect(result).toEqual({
      resume: expect.objectContaining({
        perimetre: "tous vos territoires",
        jalon_vc: JALON,
      }),
      detail: {
        motifs: ["va", "vc"],
        jalon: JALON,
        perimetre: "tous vos territoires",
        lignes: [
          {
            chantier_id: "CH-001",
            chantier_nom: "Chantier bornes",
            indicateur_id: "IND-001",
            indicateur_nom: "Nombre de bornes",
            territoire_code: "DEPT-29",
            territoire_nom: "Finistère",
            territoire_nom_affiche: "29 - Finistère",
            maille: "départementale",
            motifs: ["VA non à jour", "VC manquante"],
            date_derniere_valeur: "2025-01-31",
            mise_a_jour_attendue_depuis: "2025-03-01",
            derniere_vc_connue: { valeur: 100, jalon: 2024 },
          },
        ],
      },
    });
  });

  test("seuls les motifs demandés sont interrogés", async () => {
    // given
    const { tool, queryVa, queryViVc } = buildTool();

    // when
    await executeTool(tool, {
      messages: [{ role: "user", content: "Quelles VI manquent ?" }],
      motifs: ["vi"],
    });

    // then
    expect(queryVa.execute).not.toHaveBeenCalled();
    expect(queryViVc.execute).toHaveBeenCalledWith({
      chantierIds: ["CH-001", "CH-002", "CH-018"],
      territoireCodes: ["NAT-FR", "DEPT-29"],
      indicateurIds: undefined,
      jalon: JALON,
      valeurs: "vi",
    });
  });

  test("un seul territoire accessible : même forme plate", async () => {
    // given
    const { tool } = buildTool({ territoiresAccessibles: ["DEPT-29"] });

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_AVEC_TYPES,
      motifs: ["va"],
    });

    // then
    expect(result).toEqual({
      resume: {
        perimetre: "Finistère",
        indicateurs: [
          {
            chantier: "CH-001 · Chantier bornes",
            indicateur: "IND-001 · Nombre de bornes",
            "VA non à jour": { départementale: 1 },
          },
        ],
      },
      detail: expect.objectContaining({ perimetre: "Finistère" }),
    });
  });

  test("région et ses départements : le nom de la région", async () => {
    // given
    const { tool } = buildTool();

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_AVEC_TYPES,
      motifs: ["va"],
      perimetre: { type: "REGION_ET_SES_DEPARTEMENTS", region_code: "REG-53" },
    });

    // then
    expect(result).toEqual({
      resume: expect.anything(),
      detail: expect.objectContaining({
        perimetre: "Bretagne et ses départements",
      }),
    });
  });

  test("demandes explicites : l'indicateur sans ligne, pas le chantier ajouté par l'accès", async () => {
    // given
    const { tool } = buildTool({ lignesVa: [], lignesViVc: [] });

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_AVEC_TYPES,
      motifs: ["va"],
      indicateur_ids: ["IND-894"],
    });

    // then
    expect(result).toEqual({
      resume: expect.objectContaining({
        sans_valeur_a_completer: ["IND-894"],
      }),
      detail: expect.objectContaining({
        perimetre: "IND-894, tous vos territoires",
        lignes: [],
      }),
    });
  });

  test("demandes explicites : les indicateurs retenus seuls quand un chantier est aussi nommé", async () => {
    // given
    const { tool } = buildTool({ lignesVa: [], lignesViVc: [] });

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_AVEC_TYPES,
      motifs: ["va"],
      chantier_ids: ["CH-001"],
      indicateur_ids: ["IND-894"],
    });

    // then
    expect(result).toEqual({
      resume: expect.objectContaining({
        sans_valeur_a_completer: ["IND-894"],
      }),
      detail: expect.anything(),
    });
  });

  test("demandes explicites : les chantiers accessibles quand seuls des chantiers sont nommés", async () => {
    // given
    const { tool } = buildTool({ lignesVa: [], lignesViVc: [] });

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_AVEC_TYPES,
      motifs: ["va"],
      chantier_ids: ["CH-001", "CH-002"],
    });

    // then
    expect(result).toEqual({
      resume: expect.objectContaining({
        sans_valeur_a_completer: ["CH-001", "CH-002"],
      }),
      detail: expect.anything(),
    });
  });

  test.each([
    {
      cas: "toutes les régions",
      input: { perimetre: { type: "TOUTES_REGIONS" as const } },
      attendu: "toutes vos régions",
    },
    {
      cas: "tous les départements",
      input: { perimetre: { type: "TOUS_DEPARTEMENTS" as const } },
      attendu: "tous vos départements",
    },
    {
      cas: "France et ses régions",
      input: { perimetre: { type: "FRANCE_ET_SES_REGIONS" as const } },
      attendu: "France et ses régions",
    },
    {
      cas: "sélection avec un code inconnu",
      input: {
        perimetre: {
          type: "SELECTION" as const,
          territoire_codes: ["DEPT-29", "DEPT-35"],
        },
      },
      attendu: "Finistère, DEPT-35",
    },
    {
      cas: "préfixe des chantiers",
      input: {
        chantier_ids: ["CH-018"],
        perimetre: {
          type: "REGION_ET_SES_DEPARTEMENTS" as const,
          region_code: "REG-53",
        },
      },
      attendu: "CH-018, Bretagne et ses départements",
    },
  ])("périmètre : $cas", async ({ input, attendu }) => {
    // given
    const { tool } = buildTool();

    // when
    const result = await executeTool(tool, {
      messages: MESSAGE_AVEC_TYPES,
      motifs: ["va"],
      ...input,
    });

    // then
    expect(result).toEqual({
      resume: expect.anything(),
      detail: expect.objectContaining({ perimetre: attendu }),
    });
  });

  test("version modèle d'une clarification : la précision demandée et les champs d'accès", () => {
    // given
    const output: GetIndicateursACompleterOutput = {
      clarification: { question: "Quelles valeurs ?", choices: [] },
      chantiers_non_accessibles: ["CH-999"],
    };

    // when
    const result = indicateursACompleterVersModele({ output });

    // then
    expect(result).toEqual({
      type: "json",
      value: {
        precision_demandee: true,
        consigne:
          "Les choix sont déjà affichés à l'utilisateur. N'appelle aucun autre outil, en particulier pas clarify_with_choices. Termine ta réponse par la seule phrase « Choisissez une option pour continuer. »",
        chantiers_non_accessibles: ["CH-999"],
      },
    });
  });

  test("version modèle des données : le résumé et les champs d'accès, sans détail ni lignes", () => {
    // given
    const resume = {
      perimetre: "tous vos territoires",
      indicateurs: [
        {
          chantier: "CH-001 · Chantier",
          indicateur: "IND-001 · Indicateur",
          "VA non à jour": { départementale: 1 },
        },
      ],
    };
    const output: GetIndicateursACompleterOutput = {
      resume,
      detail: {
        motifs: ["va"],
        perimetre: "tous vos territoires",
        lignes: [],
      },
      chantiers_non_accessibles: ["CH-999"],
    };

    // when
    const result = indicateursACompleterVersModele({ output });

    // then
    expect(result).toEqual({
      type: "json",
      value: { ...resume, chantiers_non_accessibles: ["CH-999"] },
    });
  });
});
