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

const lignesNord = [
  ligne({ ...MAISONS, territoireCode: "DEPT-59", motif: "va" }),
  ligne({ ...MEDECINS, territoireCode: "DEPT-59", motif: "va" }),
  ligne({ ...MEDECINS, territoireCode: "DEPT-59", motif: "vc" }),
];

const paramsDeBase = {
  motifs: ["va", "vc"] as Motif[],
  mailles: ["REG", "DEPT"] as ("NAT" | "REG" | "DEPT")[],
  unSeulTerritoire: false,
  perimetre: "Bretagne et ses départements",
  jalon: 2026,
  demandesExplicites: [],
};

describe("resumerIndicateursACompleter", () => {
  test("plusieurs territoires", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      lignes: lignesBretagne,
    });

    expect(resume).toEqual({
      en_bref:
        "Périmètre : Bretagne et ses départements. 1 chantier et 2 indicateurs ont des valeurs à compléter (VA non à jour, VC manquante pour le jalon 2026).",
      jalon_vc: 2026,
      ensemble: {
        "VA non à jour": "1 chantier, 2 indicateurs · 1 région, 3 départements",
        "VC manquante":
          "1 chantier, 1 indicateur · aucune région, 2 départements",
        "tous motifs confondus":
          "1 chantier, 2 indicateurs · 1 région, 4 départements",
      },
      chantiers: [
        {
          chantier: "CH-038 · Accès aux soins",
          "VA non à jour": "2 indicateurs · 1 région, 3 départements",
          "VC manquante": "1 indicateur · aucune région, 2 départements",
          "tous motifs confondus": "2 indicateurs · 1 région, 4 départements",
          indicateurs: [
            {
              indicateur: "IND-894 · Maisons de santé",
              "VA non à jour": "1 région, 3 départements",
            },
            {
              indicateur: "IND-912 · Médecins",
              "VA non à jour": "aucune région, 1 département",
              "VC manquante": "aucune région, 2 départements",
            },
          ],
        },
      ],
    });
  });

  test("un seul territoire", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      lignes: lignesNord,
      unSeulTerritoire: true,
      perimetre: "Nord",
    });

    expect(resume).toEqual({
      en_bref:
        "Périmètre : Nord. 1 chantier et 2 indicateurs ont des valeurs à compléter (VA non à jour, VC manquante pour le jalon 2026).",
      jalon_vc: 2026,
      ensemble: {
        "VA non à jour": "1 chantier, 2 indicateurs",
        "VC manquante": "1 chantier, 1 indicateur",
        "tous motifs confondus": "1 chantier, 2 indicateurs",
      },
      chantiers: [
        {
          chantier: "CH-038 · Accès aux soins",
          "VA non à jour": "2 indicateurs",
          "VC manquante": "1 indicateur",
          "tous motifs confondus": "2 indicateurs",
          indicateurs: [
            {
              indicateur: "IND-894 · Maisons de santé",
              "VA non à jour": "à compléter",
            },
            {
              indicateur: "IND-912 · Médecins",
              "VA non à jour": "à compléter",
              "VC manquante": "à compléter",
            },
          ],
        },
      ],
    });
  });

  test("liste des indicateurs selon le seuil", () => {
    const lignesParIndicateur = (nombre: number) =>
      Array.from({ length: nombre }, (_, index) =>
        ligne({
          indicateurId: `IND-${String(index).padStart(3, "0")}`,
          territoireCode: "DEPT-29",
          motif: "va",
        }),
      );

    const sousLeSeuil = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["va"],
      lignes: lignesParIndicateur(20),
    });
    const auDessusDuSeuil = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["va"],
      lignes: lignesParIndicateur(21),
    });

    expect(sousLeSeuil.chantiers[0]?.indicateurs).toHaveLength(20);
    expect(auDessusDuSeuil.chantiers).toEqual([
      {
        chantier: "CH-038 · Accès aux soins",
        "VA non à jour": "21 indicateurs · aucune région, 1 département",
      },
    ]);
  });

  test("l'ensemble compte une fois un territoire concerné dans deux chantiers", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["va"],
      lignes: [
        ligne({ ...MAISONS, territoireCode: "DEPT-29", motif: "va" }),
        ligne({
          chantierId: "CH-040",
          chantierNom: "Écoles",
          ...MEDECINS,
          territoireCode: "DEPT-29",
          motif: "va",
        }),
      ],
    });

    expect(resume.ensemble).toEqual({
      "VA non à jour":
        "2 chantiers, 2 indicateurs · aucune région, 1 département",
    });
  });

  test("un motif sans ligne vaut aucun indicateur dans l'ensemble seulement", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["va", "vi"],
      jalon: undefined,
      lignes: [ligne({ ...MAISONS, territoireCode: "DEPT-29", motif: "va" })],
    });

    expect(resume.ensemble["VI manquante"]).toBe("aucun indicateur");
    expect(resume.chantiers[0]).not.toHaveProperty("VI manquante");
    expect(resume).not.toHaveProperty("jalon_vc");
  });

  test("le national est cité avec les autres mailles", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["va"],
      mailles: ["NAT", "REG", "DEPT"],
      lignes: [ligne({ ...MAISONS, territoireCode: "NAT-FR", motif: "va" })],
    });

    expect(resume.ensemble).toEqual({
      "VA non à jour":
        "1 chantier, 1 indicateur · 1 territoire national, aucune région, aucun département",
    });
  });

  test("aucune ligne", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      motifs: ["vc"],
      perimetre: "Nord",
      lignes: [],
    });

    expect(resume).toEqual({
      en_bref:
        "Périmètre : Nord. Aucune valeur à compléter (VC manquante pour le jalon 2026).",
      jalon_vc: 2026,
      ensemble: { "VC manquante": "aucun indicateur" },
      chantiers: [],
    });
  });

  test("les demandes explicites sans valeur à compléter sont listées", () => {
    const resume = resumerIndicateursACompleter({
      ...paramsDeBase,
      lignes: lignesBretagne,
      demandesExplicites: ["CH-018", "CH-038"],
    });

    expect(resume.sans_valeur_a_completer).toEqual(["CH-018"]);
  });
});
