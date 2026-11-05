import { donneesDuContexte } from "@/components/_commons/ChatUI/donneesDuContexte";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

const NOMS: Record<string, string> = {
  "REG-53": "Bretagne",
  "DEPT-29": "Finistère",
  "DEPT-35": "Ille-et-Vilaine",
};
const lireTerritoire = (code: string) => NOMS[code] ?? null;

const assistant = (parts: unknown[]): PiloteUIMessage =>
  ({ id: "message", role: "assistant", parts }) as PiloteUIMessage;

const taux = ({
  toolCallId,
  codes,
  jalon = 2026,
  perimetre,
}: {
  toolCallId: string;
  codes: string[];
  jalon?: number;
  perimetre?: unknown;
}) => ({
  type: "tool-get_taux_avancement_territoire",
  toolCallId,
  state: "output-available",
  input: { perimetre },
  output: {
    resultats: codes.map((code) => ({
      territoire_code: code,
      territoire_nom: NOMS[code],
      jalon,
      taux_avancement_global: "63%",
      mediane_repartition: "59%",
      position_mediane: "EN_AVANCE",
    })),
  },
});

const indicateurs = {
  type: "tool-get_indicateurs",
  toolCallId: "appel-indicateurs",
  state: "output-available",
  input: { chantier_id: "CH-173", territoire_code: "REG-53", jalon: 2026 },
  output: {
    resultats: {
      territoire_code: "REG-53",
      chantier_id: "CH-173",
      indicateurs: [
        {
          indicateur_id: "IND-1",
          nom: "Emploi industriel",
          unite_mesure: null,
          valeur_initiale: 0,
          date_valeur_initiale: null,
          valeur_actuelle: 0.3,
          date_valeur_actuelle: null,
          valeur_cible: 2,
          date_valeur_cible: null,
          taux_avancement: 12.4,
        },
      ],
    },
  },
};

describe("donneesDuContexte", () => {
  test("regroupe les données par territoires et jalon", () => {
    // When
    const contexte = donneesDuContexte({
      messages: [
        assistant([taux({ toolCallId: "appel-taux", codes: ["REG-53"] })]),
        assistant([indicateurs]),
      ],
      lireTerritoire,
    });

    // Then
    expect(contexte).toEqual({
      groupes: [
        {
          cle: "REG-53||2026",
          perimetre: "Bretagne · Jalon 2026",
          entrees: [
            {
              id: "appel-taux",
              titre: "Taux d'avancement",
              resume: "1 territoire, avec leur position face à la médiane",
              tableau: {
                colonnes: ["Territoire", "Taux", "Médiane"],
                lignes: [["Bretagne", "63%", "59%"]],
              },
            },
            {
              id: "appel-indicateurs",
              titre: "Indicateurs · CH-173",
              resume: "1 indicateur",
              tableau: {
                colonnes: ["Indicateur", "Actuelle", "Cible", "TA"],
                lignes: [["Emploi industriel", "0,3", "2", "12 %"]],
              },
            },
          ],
        },
      ],
      nombreEntrees: 2,
      illisibles: 0,
    });
  });

  test("nomme une région et ses départements, et sépare un autre jalon", () => {
    // When
    const contexte = donneesDuContexte({
      messages: [
        assistant([
          taux({
            toolCallId: "appel-departements",
            codes: ["REG-53", "DEPT-29", "DEPT-35"],
            perimetre: {
              type: "REGION_ET_SES_DEPARTEMENTS",
              region_code: "REG-53",
            },
          }),
          taux({ toolCallId: "appel-2025", codes: ["REG-53"], jalon: 2025 }),
        ]),
      ],
      lireTerritoire,
    });

    // Then
    expect(contexte.groupes.map((groupe) => groupe.perimetre)).toEqual([
      "Bretagne et ses 2 départements · Jalon 2026",
      "Bretagne · Jalon 2025",
    ]);
  });

  test("ignore les états provisoires, les erreurs et les outils sans données", () => {
    // When
    const contexte = donneesDuContexte({
      messages: [
        assistant([
          {
            ...taux({ toolCallId: "provisoire", codes: ["REG-53"] }),
            preliminary: true,
          },
          {
            ...taux({ toolCallId: "en-erreur", codes: ["REG-53"] }),
            state: "output-error",
          },
          {
            type: "tool-search_territoires",
            toolCallId: "recherche",
            state: "output-available",
            input: { query: "Bretagne" },
            output: { resultats: [] },
          },
        ]),
      ],
      lireTerritoire,
    });

    // Then
    expect(contexte).toEqual({ groupes: [], nombreEntrees: 0, illisibles: 0 });
  });

  test("compte comme illisible un résultat d'un format inattendu, sans bloquer les autres", () => {
    // When
    const contexte = donneesDuContexte({
      messages: [
        assistant([
          {
            type: "tool-get_chantiers",
            toolCallId: "ancien-format",
            state: "output-available",
            input: {},
            output: { chantiers: [] },
          },
          taux({ toolCallId: "appel-taux", codes: ["REG-53"] }),
        ]),
      ],
      lireTerritoire,
    });

    // Then
    expect(contexte).toEqual(
      expect.objectContaining({ nombreEntrees: 1, illisibles: 1 }),
    );
  });

  test("dit ce qu'un encart ne contient pas", () => {
    // When
    const contexte = donneesDuContexte({
      messages: [
        assistant([
          {
            type: "tool-rediger_synthese_territoire",
            toolCallId: "encart",
            state: "output-available",
            input: { territoire_code: "REG-53", jalon: 2026 },
            output: {
              type: "synthese",
              jalon: 2026,
              date_redaction: "2026-11-05T10:00:00.000Z",
              markdown: "# Synthèse pour Bretagne",
              termine: true,
              donnees: {
                taux: taux({ toolCallId: "", codes: ["REG-53"] }).output
                  .resultats,
                chantiers_en_retard: { resultats: [] },
                chantiers_en_difficulte: { resultats: [] },
              },
            },
          },
        ]),
      ],
      lireTerritoire,
    });

    // Then
    expect(contexte.groupes).toEqual([
      {
        cle: "REG-53||2026",
        perimetre: "Bretagne · Jalon 2026",
        entrees: [
          {
            id: "encart",
            titre: "Synthèse territoriale",
            resume:
              "Taux d'avancement · 0 chantier en retard · 0 en difficulté",
            absent:
              "Ne contient pas : indicateurs, commentaires typés (sur les données, actions, résultats, freins), objectifs, chantiers ni en retard ni en difficulté, autres territoires, dont les départements d'une région, et autres jalons",
          },
        ],
      },
    ]);
  });
});
