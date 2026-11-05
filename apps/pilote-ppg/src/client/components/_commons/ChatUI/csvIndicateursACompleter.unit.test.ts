import { csvIndicateursACompleter } from "@/components/_commons/ChatUI/csvIndicateursACompleter";
import type { LigneDetail } from "@/components/_commons/ChatUI/detailIndicateursACompleter";

describe("csvIndicateursACompleter", () => {
  test("sépare par des points-virgules, double les guillemets et écrit « jamais renseignée »", () => {
    // Given
    const lignes: LigneDetail[] = [
      {
        chantier_id: "CH-018",
        chantier_nom: "Accès aux soins",
        indicateur_id: "IND-1",
        indicateur_nom: 'Taux de "pose"; total',
        territoire_code: "REG-53",
        territoire_nom: "Bretagne",
        territoire_nom_affiche: "Bretagne",
        maille: "régionale",
        motif: "VA non à jour",
        date_derniere_valeur: null,
        mise_a_jour_attendue_depuis: null,
      },
    ];

    // When
    const csv = csvIndicateursACompleter({ lignes, motifs: ["va"] });

    // Then
    expect(csv).toEqual(
      '﻿"Chantier";"Indicateur";"Territoire";"Motif";"Dernière VA";"Mise à jour attendue depuis"\r\n' +
        '"CH-018 Accès aux soins";"IND-1 Taux de ""pose""; total";"Bretagne";"VA non à jour";"jamais renseignée";"—"',
    );
  });

  test("écrit les dates en JJ/MM/AAAA et les valeurs d'avancement et de cible sur la seule ligne de leur motif", () => {
    // Given
    const ligne = {
      chantier_id: "CH-018",
      chantier_nom: "Accès aux soins",
      indicateur_id: "IND-1",
      indicateur_nom: "Taux de pose",
      territoire_code: "REG-53",
      territoire_nom: "Finistère",
      territoire_nom_affiche: "29 - Finistère",
      maille: "départementale" as const,
      date_derniere_valeur: "2026-03-31",
      mise_a_jour_attendue_depuis: "2026-06-30",
      derniere_vc_connue: { valeur: 100, jalon: 2024 },
    };
    const lignes: LigneDetail[] = [
      { ...ligne, motif: "VA non à jour" },
      { ...ligne, motif: "VC manquante" },
    ];

    // When
    const csv = csvIndicateursACompleter({ lignes, motifs: ["va", "vc"] });

    // Then
    expect(csv.split("\r\n").slice(1)).toEqual([
      '"CH-018 Accès aux soins";"IND-1 Taux de pose";"29 - Finistère";"VA non à jour";"31/03/2026";"30/06/2026";"—"',
      '"CH-018 Accès aux soins";"IND-1 Taux de pose";"29 - Finistère";"VC manquante";"—";"—";"100 (jalon 2024)"',
    ]);
  });
});
