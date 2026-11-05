import { describe, expect, test, vi } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  classerChantiers,
  createGetChantiersTool,
  getChantiersInputSchema,
  type GetChantiersInput,
  type GetChantiersOutput,
} from "@/server/albert/tools/getChantiers";
import type {
  ChantierResult,
  GetChantiersParams,
  GetChantiersQuery,
} from "@/server/chantiers/query/GetChantiersQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import type { Perimetre } from "@/server/albert/domain/Perimetre";
import { personReference } from "@/shared/personne/personReference";

const DIRECTEUR_PROJET_ID = "0b3c1f2e-8a4d-4c6b-9e1f-2a3b4c5d6e7f";
const RESPONSABLE_LOCAL_ID = "1c4d2f3e-9b5e-4d7c-8f2a-3b4c5d6e7f80";
const COORDINATEUR_ID = "2d5e3a4f-0c6f-4e8d-9a3b-4c5d6e7f8091";
const AUTEUR_SYNTHESE_ID = "3e6f4b5a-1d7a-4f9e-8b4c-5d6e7f8091a2";

const buildChantier = (id: string): ChantierResult => ({
  chantier: {
    id,
    nom: `Chantier ${id}`,
    axe: "Axe",
    ppg: "PPG",
    ministeres: [],
    mailles_applicables: ["NAT", "REG"],
    directeurs_projet_ids: [DIRECTEUR_PROJET_ID],
  },
  responsables_locaux_ids: [RESPONSABLE_LOCAL_ID],
  coordinateurs_territoriaux_ids: [COORDINATEUR_ID],
  meteo: "ORAGE",
  tendance: "BAISSE",
  ecart: -5,
  taux_avancement: 40,
  est_en_retard: false,
  est_en_difficulte: true,
  synthese: {
    meteo: "ORAGE",
    commentaire: "<p>Deux postes restent vacants.</p>",
    date_meteo: "2026-01-10",
    date_commentaire: "2026-01-12",
    auteur_creation_id: AUTEUR_SYNTHESE_ID,
    auteur_modification_id: AUTEUR_SYNTHESE_ID,
  },
  commentaires: { donnees: null, autresResultats: null },
});

// Le même chantier, tel que l'outil le renvoie : des libellés, pas des codes,
// et sans commentaires territoriaux (get_chantier_commentaires les porte)
const chantierRenvoye = (id: string) => ({
  chantier: {
    id,
    nom: `Chantier ${id}`,
    axe: "Axe",
    ppg: "PPG",
    ministeres: [],
    maille_de_pilotage: "régionale" as const,
    directeurs_projet: [personReference(DIRECTEUR_PROJET_ID)],
  },
  responsables_locaux: [personReference(RESPONSABLE_LOCAL_ID)],
  coordinateurs_territoriaux: [personReference(COORDINATEUR_ID)],
  taux_avancement: 40,
  ecart: -5,
  tendance: "En baisse",
  niveau_de_confiance: "Objectifs compromis",
  est_en_retard: false,
  est_en_difficulte: true,
  synthese: {
    commentaire: "Deux postes restent vacants.",
    date_commentaire: "2026-01-12",
    auteur: personReference(AUTEUR_SYNTHESE_ID),
  },
});

// La query ne filtre sur chantierIds que si la liste est non vide, comme GetChantiersQuery
const buildQuery = (chantiersDuTerritoire: string[]) =>
  mock<GetChantiersQuery>({
    execute: vi.fn(async (params: GetChantiersParams) =>
      params.territoireCodes.map((territoireCode) => ({
        territoire_code: territoireCode,
        territoire_nom: "Île-de-France",
        jalon: params.jalon,
        chantiers: chantiersDuTerritoire
          .filter(
            (id) =>
              !params.chantierIds ||
              params.chantierIds.length === 0 ||
              params.chantierIds.includes(id),
          )
          .map(buildChantier),
      })),
    ),
  });

const buildTool = ({
  query,
  territoiresAccessibles,
  chantiersAccessibles,
}: {
  query: GetChantiersQuery;
  territoiresAccessibles: string[];
  chantiersAccessibles: string[];
}) => {
  const territoireResolver = mock<TerritoireResolver>({
    resoudre: async (perimetre: Perimetre) =>
      perimetre.type === "SELECTION"
        ? perimetre.territoire_codes
        : ["NAT-FR", "REG-75"],
  });
  return createGetChantiersTool({
    getChantiersQuery: query,
    territoireResolver,
  })({ territoiresAccessibles, chantiersAccessibles });
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantiersTool>>,
  input: {
    perimetre: GetChantiersInput["perimetre"];
    chantier_ids?: string[];
    view?: "all" | "en_retard" | "en_difficulte";
    tri?: GetChantiersInput["tri"];
    limite?: number;
  },
): Promise<GetChantiersOutput> =>
  tool.execute!(
    {
      jalon: 2026,
      limite: 20,
      ...input,
      view: input.view ?? "all",
    },
    {
      toolCallId: "test",
      messages: [],
      abortSignal: undefined,
      context: {},
    },
  ) as Promise<GetChantiersOutput>;

describe("createGetChantiersTool execute", () => {
  test("sans chantier_ids, ne retourne que les chantiers accessibles à l'utilisateur", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-062", "CH-084"]),
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      perimetre: { type: "SELECTION", territoire_codes: ["REG-75"] },
      view: "en_difficulte",
    });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-75",
        territoire_nom: "Île-de-France",
        jalon: 2026,
        chantiers: [chantierRenvoye("CH-084")],
      },
    ]);
  });

  test("avec chantier_ids, exclut les chantiers non accessibles", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-062", "CH-084"]),
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      perimetre: { type: "SELECTION", territoire_codes: ["REG-75"] },
      chantier_ids: ["CH-062", "CH-084"],
    });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-75",
        territoire_nom: "Île-de-France",
        jalon: 2026,
        chantiers: [chantierRenvoye("CH-084")],
      },
    ]);
  });

  test("signale un accès refusé quand aucun chantier_ids demandé n'est accessible", async () => {
    // Given
    const query = buildQuery(["CH-062", "CH-084"]);
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      perimetre: { type: "SELECTION", territoire_codes: ["REG-75"] },
      chantier_ids: ["CH-062"],
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
      total: 0,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("signale un accès refusé quand l'utilisateur n'a accès à aucun chantier", async () => {
    // Given
    const query = buildQuery(["CH-062", "CH-084"]);
    const tool = buildTool({
      query,
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: [],
    });

    // When
    const result = await executeTool(tool, {
      perimetre: { type: "SELECTION", territoire_codes: ["REG-75"] },
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      acces_refuse: true,
      total: 0,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("renvoie les libellés de la tendance, du niveau de confiance et de la maille de pilotage (D1), la synthèse en texte et les personnes par leur référence", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-084"]),
      territoiresAccessibles: ["REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      perimetre: { type: "SELECTION", territoire_codes: ["REG-75"] },
    });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-75",
        territoire_nom: "Île-de-France",
        jalon: 2026,
        chantiers: [chantierRenvoye("CH-084")],
      },
    ]);
  });

  test("hors périmètre, signale la restriction d'accès, garde le niveau de confiance et les directeurs de projet, masque la tendance, les commentaires et les personnes du territoire", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-084"]),
      territoiresAccessibles: ["REG-53"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      perimetre: { type: "SELECTION", territoire_codes: ["REG-75"] },
    });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "REG-75",
        territoire_nom: "Île-de-France",
        jalon: 2026,
        acces_restreint: true,
        chantiers: [
          {
            ...chantierRenvoye("CH-084"),
            responsables_locaux: [],
            coordinateurs_territoriaux: [],
            tendance: null,
            est_en_difficulte: false,
            synthese: { commentaire: null, date_commentaire: null },
          },
        ],
      },
    ]);
  });

  test("au national, signale l'analyse en retard sans objet, sans rien demander à la query", async () => {
    // Given
    const query = buildQuery(["CH-084"]);
    const tool = buildTool({
      query,
      territoiresAccessibles: ["NAT-FR"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      perimetre: { type: "SELECTION", territoire_codes: ["NAT-FR"] },
      view: "en_retard",
    });

    // Then
    expect(result).toEqual({
      resultats: [],
      non_applicable: [
        { territoire_code: "NAT-FR", raison: expect.any(String) },
      ],
      total: 0,
    });
    expect(query.execute).not.toHaveBeenCalled();
  });

  test("la France et ses régions en retard : renvoie les régions et rattache l'analyse sans objet au national", async () => {
    // Given
    const tool = buildTool({
      query: buildQuery(["CH-084"]),
      territoiresAccessibles: ["NAT-FR", "REG-75"],
      chantiersAccessibles: ["CH-084"],
    });

    // When
    const result = await executeTool(tool, {
      perimetre: { type: "FRANCE_ET_SES_REGIONS" },
      view: "en_retard",
    });

    // Then
    expect(result).toEqual({
      resultats: [
        {
          territoire_code: "REG-75",
          territoire_nom: "Île-de-France",
          jalon: 2026,
          chantiers: [chantierRenvoye("CH-084")],
        },
      ],
      non_applicable: [
        { territoire_code: "NAT-FR", raison: expect.any(String) },
      ],
      total: 1,
    });
  });
});

describe("classerChantiers", () => {
  const ligne = (id: string, ecart: number | null) => ({
    ...chantierRenvoye(id),
    ecart,
  });
  const territoire = (
    territoire_code: string,
    chantiers: ReturnType<typeof ligne>[],
  ) => ({
    territoire_code,
    territoire_nom: territoire_code,
    jalon: 2026,
    chantiers,
  });
  const sortie: GetChantiersOutput = {
    resultats: [
      territoire("DEPT-22", [ligne("CH-001", -12), ligne("CH-002", null)]),
      territoire("DEPT-29", [ligne("CH-003", -30)]),
      territoire("DEPT-35", []),
    ],
  };
  const vue = (resultat: GetChantiersOutput) =>
    resultat.resultats.map((territoireRenvoye) => ({
      territoire_code: territoireRenvoye.territoire_code,
      chantiers: territoireRenvoye.chantiers.map(
        (chantier) => chantier.chantier.id,
      ),
    }));

  test("trie tous territoires confondus, les valeurs manquantes en dernier", () => {
    // When
    const resultat = classerChantiers({
      sortie,
      tri: "ecart_croissant",
      limite: 20,
    });

    // Then
    expect(vue(resultat)).toEqual([
      { territoire_code: "DEPT-29", chantiers: ["CH-003"] },
      { territoire_code: "DEPT-22", chantiers: ["CH-001", "CH-002"] },
      { territoire_code: "DEPT-35", chantiers: [] },
    ]);
    expect(resultat.total).toEqual(3);
    expect(resultat.tronque).toBeUndefined();
  });

  test("limite sur l'ensemble des territoires et signale la coupure", () => {
    // When
    const resultat = classerChantiers({
      sortie,
      tri: "ecart_croissant",
      limite: 2,
    });

    // Then
    expect(vue(resultat)).toEqual([
      { territoire_code: "DEPT-29", chantiers: ["CH-003"] },
      { territoire_code: "DEPT-22", chantiers: ["CH-001"] },
    ]);
    expect({ total: resultat.total, tronque: resultat.tronque }).toEqual({
      total: 3,
      tronque: true,
    });
  });

  test("sans tri, garde l'ordre de la vue territoire par territoire", () => {
    // When
    const resultat = classerChantiers({ sortie, limite: 20 });

    // Then
    expect(vue(resultat)).toEqual([
      { territoire_code: "DEPT-22", chantiers: ["CH-001", "CH-002"] },
      { territoire_code: "DEPT-29", chantiers: ["CH-003"] },
      { territoire_code: "DEPT-35", chantiers: [] },
    ]);
  });

  test("accepte TOUS_DEPARTEMENTS et limite à 20 chantiers par défaut", () => {
    // When
    const input = getChantiersInputSchema.parse({
      perimetre: { type: "TOUS_DEPARTEMENTS" },
      jalon: 2025,
    });

    // Then
    expect({ perimetre: input.perimetre, limite: input.limite }).toEqual({
      perimetre: { type: "TOUS_DEPARTEMENTS" },
      limite: 20,
    });
  });
});
