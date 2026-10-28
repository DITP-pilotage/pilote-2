import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { convertToModelMessages, generateText, type UIMessage } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { Albert } from "@/server/albert/Albert";
import {
  type DonneesEncart,
  type EncartOutput,
  ecartPourLeSousAgent,
} from "@/server/albert/tools/encart";
import { createRedigerSyntheseTerritoireTool } from "@/server/albert/tools/redigerSyntheseTerritoire";
import {
  createRedigerComparaisonTerritoiresTool,
  redigerComparaisonTerritoiresInputSchema,
} from "@/server/albert/tools/redigerComparaisonTerritoires";
import type { ChantierRenvoye } from "@/server/albert/tools/getChantiers";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import type {
  ChantierResult,
  GetChantiersParams,
  GetChantiersQuery,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { GetChantierIndicateursQuery } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type { GetTerritoiresIdentiteQuery } from "@/server/chantiers/query/GetTerritoiresIdentiteQuery";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

vi.mock("@/server/albert/Albert", () => ({
  Albert: { streamSubagentText: vi.fn() },
}));

vi.mock("@/server/dependances", () => ({
  getContainer: () => ({
    resolve: (nom: string) =>
      ({
        getChantiersHabilitesQuery: { execute: async () => ["CH-071"] },
        récupérerStatistiquesAvancementChantiersUseCase: {
          run: async () => ({ médiane: 50 }),
        },
        recupererTauxAvancementTerritoireQuery: {
          executePourTerritoires: async ({
            territoireCodes,
          }: {
            territoireCodes: string[];
          }) =>
            territoireCodes.map((territoire_code) => ({
              territoire_code,
              taux_avancement: 54,
            })),
        },
      })[nom],
  }),
}));

const NOMS: Record<string, string> = {
  "DEPT-59": "Nord",
  "DEPT-33": "Gironde",
  "REG-76": "Occitanie",
  "DEPT-31": "Haute-Garonne",
};

const chantier = (id: string): ChantierResult => ({
  chantier: {
    id,
    nom: `Chantier ${id}`,
    axe: "Axe",
    ppg: "PPG",
    ministeres: [],
    mailles_applicables: ["NAT", "DEPT"],
  },
  meteo: "ORAGE",
  tendance: "BAISSE",
  ecart: -14,
  taux_avancement: 40,
  est_en_retard: id === "CH-071",
  est_en_difficulte: id === "CH-045",
  synthese: {
    meteo: "ORAGE",
    commentaire: "Deux postes restent vacants.",
    date_meteo: "2026-01-10",
    date_commentaire: "2026-01-12",
  },
  commentaires: { donnees: null, autresResultats: null },
});

// Le même chantier, tel que get_chantiers le renvoie
const chantierRenvoye = (id: string): ChantierRenvoye => ({
  chantier: {
    id,
    nom: `Chantier ${id}`,
    axe: "Axe",
    ppg: "PPG",
    ministeres: [],
    maille_de_pilotage: "départementale",
  },
  taux_avancement: 40,
  ecart: -14,
  tendance: "En baisse",
  niveau_de_confiance: "Objectifs compromis",
  est_en_retard: id === "CH-071",
  est_en_difficulte: id === "CH-045",
  synthese: {
    commentaire: "Deux postes restent vacants.",
    date_commentaire: "2026-01-12",
  },
});

const getChantiersQuery = () =>
  mock<GetChantiersQuery>({
    execute: vi.fn(async (params: GetChantiersParams) => ({
      territoire_code: params.territoireCode,
      territoire_nom: NOMS[params.territoireCode] ?? null,
      jalon: params.jalon,
      chantiers: [params.view === "en_retard" ? "CH-071" : "CH-045"]
        .filter((id) => params.chantierIds?.includes(id))
        .map(chantier),
    })),
  });

const territoireResolver = () =>
  mock<TerritoireResolver>({
    resoudre: vi.fn(async (perimetre: Perimetre) =>
      perimetre.type === "SELECTION"
        ? perimetre.territoire_codes
        : perimetre.type === "REGION_ET_SES_DEPARTEMENTS"
          ? [perimetre.region_code, "DEPT-31"]
          : [],
    ),
  });

const getTerritoiresIdentiteQuery = mock<GetTerritoiresIdentiteQuery>({
  execute: async () =>
    Object.entries(NOMS).map(([code, nom]) => ({
      code,
      nom,
      maille: code.startsWith("REG") ? "REG" : "DEPT",
      code_parent: null,
    })),
});

const habilitations = ({
  chantiers,
  territoires,
}: {
  chantiers: string[];
  territoires: string[];
}) => ({ lecture: { chantiers, territoires } }) as unknown as Habilitations;

const OPTIONS = {
  toolCallId: "appel-1",
  messages: [],
  abortSignal: undefined,
  context: {},
};

const collecter = async (sorties: unknown): Promise<EncartOutput[]> => {
  const resultat: EncartOutput[] = [];
  for await (const sortie of sorties as AsyncIterable<EncartOutput>) {
    resultat.push(sortie);
  }
  return resultat;
};

// Chaque morceau arrive `intervalleMs` après le précédent
const subagentRedige = (morceaux: string[], intervalleMs = 200) =>
  vi.mocked(Albert.streamSubagentText).mockImplementation(async function* () {
    for (const morceau of morceaux) {
      vi.setSystemTime(Date.now() + intervalleMs);
      yield morceau;
    }
  });

const indicateursQuery = () =>
  mock<GetChantierIndicateursQuery>({
    execute: vi.fn(async ({ chantierId, territoireCode }) => ({
      territoire_code: territoireCode,
      chantier_id: chantierId,
      indicateurs: [
        {
          indicateur_id: `IND-${chantierId.slice(3)}`,
          nom: `Indicateur de ${chantierId}`,
          unite_mesure: "pourcentage",
          valeur_initiale: 40,
          date_valeur_initiale: "2023-01-01",
          valeur_actuelle: 53.25,
          date_valeur_actuelle: "2026-06-30",
          valeur_cible: 60,
          date_valeur_cible: "2026-12-31",
          taux_avancement: 66.25,
        },
      ],
    })),
  });

const syntheseDuNord = ({
  query = getChantiersQuery(),
  chantiers = ["CH-071", "CH-045"],
  getChantierIndicateursQuery = indicateursQuery(),
}: {
  query?: GetChantiersQuery;
  chantiers?: string[];
  getChantierIndicateursQuery?: GetChantierIndicateursQuery;
} = {}) =>
  createRedigerSyntheseTerritoireTool({
    getChantiersQuery: query,
    territoireResolver: territoireResolver(),
    getTerritoiresIdentiteQuery,
    getChantierIndicateursQuery,
  })({ habilitations: habilitations({ chantiers, territoires: ["DEPT-59"] }) });

const DONNEES_DU_NORD: DonneesEncart = {
  taux: [
    {
      territoire_code: "DEPT-59",
      territoire_nom: "Nord",
      jalon: 2025,
      taux_avancement_global: "54%",
      mediane_repartition: "50%",
      position_mediane: "DANS_LA_MEDIANE",
    },
  ],
  chantiers_en_retard: {
    resultats: [
      {
        territoire_code: "DEPT-59",
        territoire_nom: "Nord",
        jalon: 2025,
        chantiers: [chantierRenvoye("CH-071")],
      },
    ],
  },
  chantiers_en_difficulte: {
    resultats: [
      {
        territoire_code: "DEPT-59",
        territoire_nom: "Nord",
        jalon: 2025,
        chantiers: [chantierRenvoye("CH-045")],
      },
    ],
  },
};

const encart = (surcharge: Partial<EncartOutput>): EncartOutput => ({
  type: "synthese",
  jalon: 2025,
  date_redaction: "2026-10-27T10:00:00.000Z",
  markdown: "",
  termine: false,
  ...surcharge,
});

describe("outils de rédaction d'encart", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-27T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test("rédige la synthèse en streaming puis rend les données", async () => {
    // Given
    subagentRedige(["# Synthèse", " pour le Nord"]);

    // When
    const sorties = await collecter(
      syntheseDuNord().execute!(
        { territoire_code: "DEPT-59", jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    expect(sorties).toEqual([
      encart({ markdown: "" }),
      encart({ markdown: "# Synthèse" }),
      encart({ markdown: "# Synthèse pour le Nord" }),
      encart({
        markdown: "# Synthèse pour le Nord",
        termine: true,
        donnees: DONNEES_DU_NORD,
      }),
    ]);
  });

  test("regroupe les morceaux rédigés trop rapprochés", async () => {
    // Given
    subagentRedige(["# Synthèse", " pour", " le Nord"], 10);

    // When
    const sorties = await collecter(
      syntheseDuNord().execute!(
        { territoire_code: "DEPT-59", jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    expect(sorties.map((sortie) => sortie.markdown)).toEqual([
      "",
      "# Synthèse pour le Nord",
    ]);
  });

  test("passe au sous-agent des données prêtes à recopier, sans les drapeaux ni les commentaires détaillés", async () => {
    // Given
    subagentRedige(["# Synthèse"]);
    const chantierPourLeSousAgent = (id: string) => ({
      id,
      nom: `Chantier ${id}`,
      ecart: "−14 points",
      niveau_de_confiance: "Objectifs compromis",
      tendance: "En baisse",
      commentaire_de_synthese: "Deux postes restent vacants.",
    });

    // When
    await collecter(
      syntheseDuNord().execute!(
        { territoire_code: "DEPT-59", jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    expect(
      JSON.parse(vi.mocked(Albert.streamSubagentText).mock.calls[0][0].prompt),
    ).toEqual({
      taux: DONNEES_DU_NORD.taux,
      chantiers_en_retard: {
        resultats: [
          {
            territoire_code: "DEPT-59",
            territoire_nom: "Nord",
            chantiers: [chantierPourLeSousAgent("CH-071")],
          },
        ],
      },
      chantiers_en_difficulte: {
        resultats: [
          {
            territoire_code: "DEPT-59",
            territoire_nom: "Nord",
            chantiers: [chantierPourLeSousAgent("CH-045")],
          },
        ],
      },
    });
  });

  test("à la demande, ajoute les indicateurs de chaque chantier, prêts à recopier, le pourcentage en %", async () => {
    // Given
    subagentRedige(["# Synthèse"]);
    const getChantierIndicateursQuery = indicateursQuery();

    // When
    const sorties = await collecter(
      syntheseDuNord({ getChantierIndicateursQuery }).execute!(
        { territoire_code: "DEPT-59", jalon: 2025, avec_indicateurs: true },
        OPTIONS,
      ),
    );

    // Then
    expect(getChantierIndicateursQuery.execute).toHaveBeenCalledWith({
      territoireCode: "DEPT-59",
      chantierId: "CH-071",
      jalon: 2025,
    });
    const prompt = JSON.parse(
      vi.mocked(Albert.streamSubagentText).mock.calls[0][0].prompt,
    ) as {
      chantiers_en_retard: {
        resultats: { chantiers: { indicateurs: unknown }[] }[];
      };
    };
    expect(
      prompt.chantiers_en_retard.resultats[0].chantiers[0].indicateurs,
    ).toEqual([
      {
        id: "IND-071",
        nom: "Indicateur de CH-071",
        valeur_initiale: "40 %",
        valeur_actuelle: "53,25 %",
        valeur_cible: "60 %",
        taux_avancement: "66 %",
      },
    ]);
    expect(sorties.at(-1)?.donnees?.indicateurs).toHaveLength(2);
  });

  test("sans demande, ne lit pas les indicateurs", async () => {
    // Given
    subagentRedige(["# Synthèse"]);
    const getChantierIndicateursQuery = indicateursQuery();

    // When
    await collecter(
      syntheseDuNord({ getChantierIndicateursQuery }).execute!(
        { territoire_code: "DEPT-59", jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    expect(getChantierIndicateursQuery.execute).not.toHaveBeenCalled();
  });

  test("sans aucun chantier accessible, ne lance pas le sous-agent", async () => {
    // When
    const sorties = await collecter(
      syntheseDuNord({ chantiers: [] }).execute!(
        { territoire_code: "DEPT-59", jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    expect(sorties).toEqual([encart({ termine: true, acces_refuse: true })]);
    expect(Albert.streamSubagentText).not.toHaveBeenCalled();
  });

  test("compare des territoires désignés", async () => {
    // Given
    subagentRedige(["# Comparaison"]);
    const outil = createRedigerComparaisonTerritoiresTool({
      getChantiersQuery: getChantiersQuery(),
      territoireResolver: territoireResolver(),
      getTerritoiresIdentiteQuery,
    })({
      habilitations: habilitations({
        chantiers: ["CH-071", "CH-045"],
        territoires: ["DEPT-59", "DEPT-33"],
      }),
    });

    // When
    const sorties = await collecter(
      outil.execute!(
        { territoire_codes: ["DEPT-59", "DEPT-33"], jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    expect(
      sorties.at(-1)?.donnees?.taux.map((taux) => taux.territoire_nom),
    ).toEqual(["Nord", "Gironde"]);
    expect(sorties.at(-1)?.type).toEqual("comparaison");
  });

  test("compare un territoire et ses sous-territoires", async () => {
    // Given
    subagentRedige(["# Comparaison"]);
    const resolver = territoireResolver();
    const outil = createRedigerComparaisonTerritoiresTool({
      getChantiersQuery: getChantiersQuery(),
      territoireResolver: resolver,
      getTerritoiresIdentiteQuery,
    })({
      habilitations: habilitations({
        chantiers: ["CH-071", "CH-045"],
        territoires: ["REG-76"],
      }),
    });

    // When
    const sorties = await collecter(
      outil.execute!(
        {
          territoire_code: "REG-76",
          include_sous_territoires: true,
          jalon: 2025,
        },
        OPTIONS,
      ),
    );

    // Then
    expect(resolver.resoudre).toHaveBeenCalledWith({
      type: "REGION_ET_SES_DEPARTEMENTS",
      region_code: "REG-76",
    });
    expect(
      sorties.at(-1)?.donnees?.taux.map((taux) => taux.territoire_code),
    ).toEqual(["REG-76", "DEPT-31"]);
  });

  test("prend en charge le rapport, et oriente un graphique vers le dashboard", () => {
    // When
    const outil = createRedigerComparaisonTerritoiresTool({
      getChantiersQuery: getChantiersQuery(),
      territoireResolver: territoireResolver(),
      getTerritoiresIdentiteQuery,
    })({
      habilitations: habilitations({ chantiers: [], territoires: [] }),
    });

    // Then
    expect(outil.description).toContain("l'encart se télécharge");
    expect(outil.description).toContain("create_dashboard");
  });

  test("refuse une entrée qui mélange les deux formes", () => {
    // When
    const resultat = redigerComparaisonTerritoiresInputSchema.safeParse({
      territoire_codes: ["DEPT-59", "DEPT-33"],
      territoire_code: "REG-76",
      jalon: 2025,
    });

    // Then
    expect(resultat.success).toEqual(false);
  });

  test("ne rend au modèle que le markdown, y compris dans l'historique", async () => {
    // Given
    const message: UIMessage = {
      id: "message-1",
      role: "assistant",
      parts: [
        {
          type: "tool-rediger_synthese_territoire",
          toolCallId: "appel-1",
          state: "output-available",
          input: { territoire_code: "DEPT-59", jalon: 2025 },
          output: encart({
            markdown: "# Synthèse pour le Nord",
            termine: true,
            donnees: DONNEES_DU_NORD,
          }),
        },
      ],
    } as UIMessage;

    // When
    const messages = await convertToModelMessages([message], {
      tools: { rediger_synthese_territoire: syntheseDuNord() },
    });

    // Then
    const resultatsOutil = messages.flatMap((modelMessage) =>
      modelMessage.role === "tool"
        ? modelMessage.content.flatMap((part) =>
            part.type === "tool-result" ? [part.output] : [],
          )
        : [],
    );
    expect(resultatsOutil).toEqual([
      {
        type: "text",
        value: "# Synthèse pour le Nord",
      },
    ]);
  });

  test("generateText retient le dernier résultat de l'outil", async () => {
    // Given
    subagentRedige(["# Synthèse", " pour le Nord"]);
    let appels = 0;
    const usage = {
      inputTokens: {
        total: 1,
        noCache: 1,
        cacheRead: undefined,
        cacheWrite: undefined,
      },
      outputTokens: { total: 1, text: 1, reasoning: undefined },
    };
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        appels += 1;
        return appels === 1
          ? {
              content: [
                {
                  type: "tool-call" as const,
                  toolCallId: "appel-1",
                  toolName: "rediger_synthese_territoire",
                  input: JSON.stringify({
                    territoire_code: "DEPT-59",
                    jalon: 2025,
                  }),
                },
              ],
              finishReason: { unified: "tool-calls" as const, raw: undefined },
              usage,
              warnings: [],
            }
          : {
              content: [{ type: "text" as const, text: "Voici la synthèse." }],
              finishReason: { unified: "stop" as const, raw: undefined },
              usage,
              warnings: [],
            };
      },
    });

    // When
    const resultat = await generateText({
      model,
      prompt: "Fais-moi la synthèse du Nord",
      tools: { rediger_synthese_territoire: syntheseDuNord() },
      stopWhen: () => appels >= 2,
    });

    // Then
    expect(
      (resultat.steps[0].toolResults[0].output as EncartOutput).termine,
    ).toEqual(true);
  });
  test("au national sans aucun chantier accessible, ne lance pas le sous-agent", async () => {
    // When
    const sorties = await collecter(
      syntheseDuNord({ chantiers: [] }).execute!(
        { territoire_code: "NAT-FR", jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    expect(sorties).toEqual([encart({ termine: true, acces_refuse: true })]);
    expect(Albert.streamSubagentText).not.toHaveBeenCalled();
  });

  test("au national, passe au sous-agent que l'analyse en retard est sans objet", async () => {
    // Given
    subagentRedige(["# Synthèse"]);

    // When
    const sorties = await collecter(
      syntheseDuNord().execute!(
        { territoire_code: "NAT-FR", jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    expect(sorties.at(-1)?.donnees?.chantiers_en_retard).toEqual({
      resultats: [],
      non_applicable: [
        { territoire_code: "NAT-FR", raison: expect.any(String) },
      ],
    });
  });

  test("en comparaison, rattache l'analyse sans objet au seul territoire national", async () => {
    // Given
    subagentRedige(["# Comparaison"]);
    const outil = createRedigerComparaisonTerritoiresTool({
      getChantiersQuery: getChantiersQuery(),
      territoireResolver: territoireResolver(),
      getTerritoiresIdentiteQuery,
    })({
      habilitations: habilitations({
        chantiers: ["CH-071", "CH-045"],
        territoires: ["DEPT-59"],
      }),
    });

    // When
    const sorties = await collecter(
      outil.execute!(
        { territoire_codes: ["NAT-FR", "DEPT-59"], jalon: 2025 },
        OPTIONS,
      ),
    );

    // Then
    const enRetard = sorties.at(-1)?.donnees?.chantiers_en_retard;
    expect(
      enRetard?.resultats.map((resultat) => resultat.territoire_code),
    ).toEqual(["DEPT-59"]);
    expect(enRetard?.non_applicable).toEqual([
      { territoire_code: "NAT-FR", raison: expect.any(String) },
    ]);
  });
});

describe("ecartPourLeSousAgent", () => {
  test.each([
    [-14.4, "−14 points"],
    [3, "+3 points"],
    [-1, "−1 point"],
    [0, "0 point"],
    [null, "écart non calculé"],
  ])("écrit %s comme « %s »", (ecart, attendu) => {
    // When
    const ecrit = ecartPourLeSousAgent({ ecart });

    // Then
    expect(ecrit).toEqual(attendu);
  });
});
