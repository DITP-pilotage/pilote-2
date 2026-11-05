import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import { Albert } from "@/server/albert/Albert";
import type { EncartChantierOutput } from "@/server/albert/tools/encart";
import { encartChantierVersModele } from "@/server/albert/tools/encartChantier";
import { createRedigerSyntheseChantierTool } from "@/server/albert/tools/redigerSyntheseChantier";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import type { GetChantierCommentairesQuery } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { GetChantierIndicateursQuery } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type {
  ChantierResult,
  GetChantiersParams,
  GetChantiersQuery,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { Habilitations } from "@/shared/utilisateur/habilitation/Habilitation.interface";

vi.mock("@/server/albert/Albert", () => ({
  Albert: { streamSubagentText: vi.fn() },
}));

// Le conteneur tire next-auth, que les tests unitaires ne chargent pas
vi.mock("@/server/dependances", () => ({ getContainer: vi.fn() }));

const AUTEUR_ID = "5d0c9e2a-7b31-4c8e-a1f4-0e6b2d9c3a71";

const CH_071: ChantierResult = {
  chantier: {
    id: "CH-071",
    nom: "Chantier CH-071",
    axe: "Axe",
    ppg: "PPG",
    ministeres: [],
    mailles_applicables: ["NAT", "DEPT"],
  },
  meteo: "ORAGE",
  tendance: "BAISSE",
  ecart: -14.4,
  taux_avancement: 40.2,
  est_en_retard: true,
  est_en_difficulte: false,
  synthese: {
    meteo: "ORAGE",
    commentaire: "<p>Deux postes restent vacants.</p>",
    date_meteo: "2026-01-10",
    date_commentaire: "2026-01-12",
  },
  commentaires: { donnees: null, autresResultats: null },
};

const getChantiersQuery = (chantiers: ChantierResult[] = [CH_071]) =>
  mock<GetChantiersQuery>({
    execute: vi.fn(async (params: GetChantiersParams) =>
      params.territoireCodes.map((territoireCode) => ({
        territoire_code: territoireCode,
        territoire_nom: "Morbihan",
        jalon: params.jalon,
        chantiers: chantiers.filter((chantier) =>
          params.chantierIds?.includes(chantier.chantier.id),
        ),
      })),
    ),
  });

const territoireResolver = mock<TerritoireResolver>({
  resoudre: vi.fn(async (perimetre: Perimetre) =>
    perimetre.type === "SELECTION" ? perimetre.territoire_codes : [],
  ),
});

const getChantierIndicateursQuery = mock<GetChantierIndicateursQuery>({
  execute: vi.fn(async ({ chantierId, territoireCode }) => ({
    territoire_code: territoireCode,
    chantier_id: chantierId,
    indicateurs: [
      {
        indicateur_id: "IND-071",
        nom: "Indicateur du CH-071",
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

const getChantierCommentairesQuery = () =>
  mock<GetChantierCommentairesQuery>({
    execute: vi.fn(async ({ chantierId, territoireCode }) => ({
      resultats: [
        {
          territoire_code: territoireCode,
          territoire_nom: "Morbihan",
          chantier_id: chantierId,
          commentaires: [
            {
              id: "commentaire-2",
              date_publication: "2026-03-01T10:00:00.000Z",
              contenu: "<p>Les recrutements reprennent.</p>",
              type: "commentaires_sur_les_donnees",
              auteur_creation_id: AUTEUR_ID,
              auteur_modification_id: AUTEUR_ID,
            },
            {
              id: "commentaire-1",
              date_publication: "2026-01-01T10:00:00.000Z",
              contenu: "<p>Les recrutements sont gelés.</p>",
              type: "commentaires_sur_les_donnees",
              auteur_creation_id: AUTEUR_ID,
              auteur_modification_id: AUTEUR_ID,
            },
          ],
        },
      ],
      types_non_accessibles: [],
    })),
  });

const habilitations = ({
  chantiers = ["CH-071"],
  territoires = ["DEPT-56"],
}: {
  chantiers?: string[];
  territoires?: string[];
} = {}) =>
  ({ lecture: { chantiers, territoires } }) as unknown as Habilitations;

const OPTIONS = {
  toolCallId: "appel-1",
  messages: [],
  abortSignal: undefined,
  context: {},
};

const collecter = async (sorties: unknown): Promise<EncartChantierOutput[]> => {
  const resultat: EncartChantierOutput[] = [];
  for await (const sortie of sorties as AsyncIterable<EncartChantierOutput>) {
    resultat.push(sortie);
  }
  return resultat;
};

const subagentRedige = (morceaux: string[]) =>
  vi.mocked(Albert.streamSubagentText).mockImplementation(async function* () {
    for (const morceau of morceaux) {
      vi.setSystemTime(Date.now() + 200);
      yield morceau;
    }
  });

const outil = ({
  query = getChantiersQuery(),
  commentairesQuery = getChantierCommentairesQuery(),
  droits = habilitations(),
}: {
  query?: GetChantiersQuery;
  commentairesQuery?: GetChantierCommentairesQuery;
  droits?: Habilitations;
} = {}) =>
  createRedigerSyntheseChantierTool({
    getChantiersQuery: query,
    territoireResolver,
    getChantierIndicateursQuery,
    getChantierCommentairesQuery: commentairesQuery,
  })({ habilitations: droits });

const INPUT = {
  chantier_id: "CH-071",
  territoire_code: "DEPT-56",
  jalon: 2025,
};

const promptDuSousAgent = () =>
  JSON.parse(vi.mocked(Albert.streamSubagentText).mock.calls[0][0].prompt);

describe("rediger_synthese_chantier", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-09T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test("rédige l'encart en streaming, de type synthese_chantier", async () => {
    // Given
    subagentRedige(["# CH-071", " — Chantier CH-071"]);

    // When
    const sorties = await collecter(outil().execute!(INPUT, OPTIONS));

    // Then
    expect(
      sorties.map(({ type, markdown, termine }) => ({
        type,
        markdown,
        termine,
      })),
    ).toEqual([
      { type: "synthese_chantier", markdown: "", termine: false },
      { type: "synthese_chantier", markdown: "# CH-071", termine: false },
      {
        type: "synthese_chantier",
        markdown: "# CH-071 — Chantier CH-071",
        termine: false,
      },
      {
        type: "synthese_chantier",
        markdown: "# CH-071 — Chantier CH-071",
        termine: true,
      },
    ]);
  });

  test("passe au sous-agent le chantier, ses indicateurs et la version en vigueur des commentaires du territoire", async () => {
    // Given
    subagentRedige(["# CH-071"]);

    // When
    await collecter(outil().execute!(INPUT, OPTIONS));

    // Then
    expect(promptDuSousAgent()).toEqual({
      jalon: 2025,
      territoire: { nom: "Morbihan", maille: "département" },
      chantier: {
        id: "CH-071",
        nom: "Chantier CH-071",
        taux_avancement: "40 %",
        ecart: "−14 points",
        position_face_a_la_mediane: "en retard",
        niveau_de_confiance: "Objectifs compromis",
        tendance: "En baisse",
        commentaire_de_synthese: "Deux postes restent vacants.",
      },
      indicateurs: [
        {
          id: "IND-071",
          nom: "Indicateur du CH-071",
          valeur_initiale: "40 %",
          valeur_actuelle: "53,25 %",
          valeur_cible: "60 %",
          taux_avancement: "66 %",
        },
      ],
      commentaires: [
        {
          type: "Commentaires sur les données",
          date_publication: "2026-03-01",
          contenu: "Les recrutements reprennent.",
        },
      ],
    });
  });

  test("ne lit pas les commentaires d'un territoire hors de l'accès complet", async () => {
    // Given
    subagentRedige(["# CH-071"]);
    const commentairesQuery = getChantierCommentairesQuery();

    // When
    await collecter(
      outil({
        commentairesQuery,
        droits: habilitations({ territoires: ["DEPT-35"] }),
      }).execute!(INPUT, OPTIONS),
    );

    // Then
    expect(commentairesQuery.execute).not.toHaveBeenCalled();
    expect(promptDuSousAgent()).toMatchObject({
      territoire: { acces_restreint: true },
      chantier: {
        tendance: "non accessible (restriction d'accès)",
        commentaire_de_synthese: null,
      },
      commentaires: [],
    });
  });

  test("refuse l'encart d'un chantier inaccessible, sans appeler le sous-agent", async () => {
    // When
    const sorties = await collecter(
      outil({ droits: habilitations({ chantiers: ["CH-001"] }) }).execute!(
        INPUT,
        OPTIONS,
      ),
    );

    // Then
    expect(sorties).toEqual([
      {
        type: "synthese_chantier",
        jalon: 2025,
        date_redaction: "2026-11-09T10:00:00.000Z",
        markdown: "",
        termine: true,
        acces_refuse: true,
      },
    ]);
    expect(Albert.streamSubagentText).not.toHaveBeenCalled();
  });

  test("dit au sous-agent quand le chantier n'a pas de données sur le territoire", async () => {
    // Given
    subagentRedige(["# CH-071"]);

    // When
    await collecter(
      outil({ query: getChantiersQuery([]) }).execute!(INPUT, OPTIONS),
    );

    // Then
    expect(promptDuSousAgent()).toMatchObject({ chantier: null });
  });

  test("rend au modèle le texte, la couverture et les données de l'encart", async () => {
    // Given
    subagentRedige(["# CH-071"]);
    const sorties = await collecter(outil().execute!(INPUT, OPTIONS));

    // When
    const { value } = encartChantierVersModele({ output: sorties.at(-1)! });

    // Then
    expect(value).toContain(
      "# CH-071\n\n---\nContexte pour les questions suivantes.",
    );
    expect(value).toContain('"chantier":"CH-071"');
    expect(value).toContain('"objectifs du chantier"');
  });
});
