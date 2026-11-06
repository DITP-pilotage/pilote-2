import { describe, expect, test } from "vitest";
import {
  fusionnerLignes,
  versLigneACompleter,
} from "@/server/albert/tools/indicateursACompleter";
import type { LigneIndicateurNonAJour } from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";
import type { LigneIndicateurSansViVc } from "@/server/chantiers/infrastructure/queries/GetIndicateursSansViVcQuery";

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
  viManquante: false,
  vcManquante: true,
  derniereVcConnue: { valeur: 100, jalon: 2024 },
};

describe("fusionnerLignes et versLigneACompleter", () => {
  test("fusionne un territoire en retard de VA et sans VC en une ligne à deux motifs", () => {
    const lignes = fusionnerLignes({
      motifs: ["va", "vc"],
      lignesVa: [LIGNE_VA],
      lignesViVc: [LIGNE_VI_VC],
    });

    expect(lignes.map(versLigneACompleter)).toEqual([
      {
        chantier_id: "CH-001",
        chantier_nom: "Chantier bornes",
        indicateur_id: "IND-001",
        indicateur_nom: "Nombre de bornes",
        territoire_code: "DEPT-29",
        territoire_nom: "Finistère",
        territoire_nom_affiche: "29 - Finistère",
        maille: "DEPT",
        motifs: ["VA non à jour", "VC manquante"],
        date_derniere_valeur: "2025-01-31",
        mise_a_jour_attendue_depuis: "2025-03-01",
        derniere_vc_connue: { valeur: 100, jalon: 2024 },
      },
    ]);
  });

  test("ignore un motif non demandé présent dans les lignes de la query", () => {
    const lignes = fusionnerLignes({
      motifs: ["vi"],
      lignesVa: [],
      lignesViVc: [{ ...LIGNE_VI_VC, viManquante: true, vcManquante: true }],
    });

    expect(lignes.map(versLigneACompleter)).toEqual([
      {
        chantier_id: "CH-001",
        chantier_nom: "Chantier bornes",
        indicateur_id: "IND-001",
        indicateur_nom: "Nombre de bornes",
        territoire_code: "DEPT-29",
        territoire_nom: "Finistère",
        territoire_nom_affiche: "29 - Finistère",
        maille: "DEPT",
        motifs: ["VI manquante"],
      },
    ]);
  });

  test("trie les lignes par chantier, indicateur puis territoire", () => {
    const lignes = fusionnerLignes({
      motifs: ["va"],
      lignesVa: [
        { ...LIGNE_VA, territoireCode: "DEPT-35" },
        { ...LIGNE_VA, chantierId: "CH-002", indicateurId: "IND-001" },
        { ...LIGNE_VA, indicateurId: "IND-002" },
        { ...LIGNE_VA, territoireCode: "DEPT-22" },
      ],
      lignesViVc: [],
    });

    expect(
      lignes.map((ligne) => [
        ligne.chantierId,
        ligne.indicateurId,
        ligne.territoireCode,
      ]),
    ).toEqual([
      ["CH-001", "IND-001", "DEPT-22"],
      ["CH-001", "IND-001", "DEPT-35"],
      ["CH-001", "IND-002", "DEPT-29"],
      ["CH-002", "IND-001", "DEPT-29"],
    ]);
  });
});
