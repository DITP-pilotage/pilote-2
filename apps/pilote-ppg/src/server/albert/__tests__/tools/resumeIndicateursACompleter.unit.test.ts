import { describe, expect, test } from "vitest";
import type {
  LigneFusionnee,
  Motif,
} from "@/server/albert/tools/indicateursACompleter";
import { resumerIndicateursACompleter } from "@/server/albert/tools/resumeIndicateursACompleter";

const ligne = ({
  chantierId = "CH-038",
  chantierNom = "Accès aux soins",
  indicateurId,
  indicateurNom = indicateurId,
  territoireCode,
  motif,
}: {
  chantierId?: string;
  chantierNom?: string;
  indicateurId: string;
  indicateurNom?: string;
  territoireCode: string;
  motif: Motif;
}): LigneFusionnee => ({
  chantierId,
  chantierNom,
  indicateurId,
  indicateurNom,
  maille: territoireCode.startsWith("REG")
    ? "REG"
    : territoireCode.startsWith("NAT")
      ? "NAT"
      : "DEPT",
  territoireCode,
  territoireNom: territoireCode,
  territoireNomAffiche: territoireCode,
  motifs: new Set([motif]),
});

const MAISONS = { indicateurId: "IND-894", indicateurNom: "Maisons de santé" };
const MEDECINS = { indicateurId: "IND-912", indicateurNom: "Médecins" };

const lignesBretagne = [
  ligne({ ...MAISONS, territoireCode: "REG-53", motif: "va" }),
  ligne({ ...MAISONS, territoireCode: "DEPT-22", motif: "va" }),
  ligne({ ...MAISONS, territoireCode: "DEPT-29", motif: "va" }),
  ligne({ ...MAISONS, territoireCode: "DEPT-35", motif: "va" }),
  ligne({ ...MEDECINS, territoireCode: "DEPT-29", motif: "va" }),
  ligne({ ...MEDECINS, territoireCode: "DEPT-29", motif: "vc" }),
  ligne({ ...MEDECINS, territoireCode: "DEPT-56", motif: "vc" }),
];

const paramsDeBase = {
  motifs: ["va", "vc"] as Motif[],
  mailles: ["REG", "DEPT"] as ("NAT" | "REG" | "DEPT")[],
  perimetre: "Bretagne et ses départements",
  jalon: 2026,
  demandesExplicites: [],
};

describe("resumerIndicateursACompleter", () => {
  test("exemple de la spec", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      lignes: lignesBretagne,
    });

    expect(resume).toEqual({
      perimetre: "Bretagne et ses départements",
      jalon_vc: 2026,
      chantiers: [
        {
          chantier: "CH-038 · Accès aux soins",
          indicateurs: [
            {
              indicateur: "IND-894 · Maisons de santé",
              "VA non à jour": { régionale: 1, départementale: 3 },
            },
            {
              indicateur: "IND-912 · Médecins",
              "VA non à jour": { régionale: 0, départementale: 1 },
              "VC manquante": { régionale: 0, départementale: 2 },
            },
          ],
        },
      ],
    });
  });

  test("mailles à zéro et nationale", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["va"],
      mailles: ["NAT", "REG", "DEPT"],
      perimetre: "France",
      jalon: undefined,
      lignes: [ligne({ ...MAISONS, territoireCode: "NAT-FR", motif: "va" })],
    });

    expect(resume).toEqual({
      perimetre: "France",
      chantiers: [
        {
          chantier: "CH-038 · Accès aux soins",
          indicateurs: [
            {
              indicateur: "IND-894 · Maisons de santé",
              "VA non à jour": {
                nationale: 1,
                régionale: 0,
                départementale: 0,
              },
            },
          ],
        },
      ],
    });
  });

  test("tri par chantier puis par indicateur", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["va"],
      jalon: undefined,
      lignes: [
        ligne({
          chantierId: "CH-002",
          chantierNom: "Deux",
          indicateurId: "IND-020",
          territoireCode: "DEPT-29",
          motif: "va",
        }),
        ligne({
          chantierId: "CH-002",
          chantierNom: "Deux",
          indicateurId: "IND-010",
          territoireCode: "DEPT-29",
          motif: "va",
        }),
        ligne({
          chantierId: "CH-001",
          chantierNom: "Un",
          indicateurId: "IND-030",
          territoireCode: "DEPT-29",
          motif: "va",
        }),
      ],
    });

    expect(resume.chantiers).toEqual([
      {
        chantier: "CH-001 · Un",
        indicateurs: [
          {
            indicateur: "IND-030 · IND-030",
            "VA non à jour": { régionale: 0, départementale: 1 },
          },
        ],
      },
      {
        chantier: "CH-002 · Deux",
        indicateurs: [
          {
            indicateur: "IND-010 · IND-010",
            "VA non à jour": { régionale: 0, départementale: 1 },
          },
          {
            indicateur: "IND-020 · IND-020",
            "VA non à jour": { régionale: 0, départementale: 1 },
          },
        ],
      },
    ]);
  });

  test("aucune ligne", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["vc"],
      lignes: [],
    });

    expect(resume).toEqual({
      perimetre: "Bretagne et ses départements",
      jalon_vc: 2026,
      chantiers: [],
    });
  });

  test("sans valeur à compléter", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["va"],
      jalon: undefined,
      demandesExplicites: ["IND-894", "CH-018"],
      lignes: [ligne({ ...MAISONS, territoireCode: "DEPT-29", motif: "va" })],
    });

    expect(resume).toEqual({
      perimetre: "Bretagne et ses départements",
      chantiers: [
        {
          chantier: "CH-038 · Accès aux soins",
          indicateurs: [
            {
              indicateur: "IND-894 · Maisons de santé",
              "VA non à jour": { régionale: 0, départementale: 1 },
            },
          ],
        },
      ],
      sans_valeur_a_completer: ["CH-018"],
    });
  });
});
