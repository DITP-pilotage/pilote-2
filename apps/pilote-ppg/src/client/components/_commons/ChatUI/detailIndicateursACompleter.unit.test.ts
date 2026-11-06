import { lignesDetail } from "@/components/_commons/ChatUI/detailIndicateursACompleter";

describe("lignesDetail", () => {
  test("découpe chaque ligne en une ligne par motif et garde le nom du chantier", () => {
    // Given
    const lignes = [
      {
        chantier_id: "CH-018",
        chantier_nom: "Accès aux soins",
        indicateur_id: "IND-1",
        indicateur_nom: "Taux de pose",
        territoire_code: "REG-53",
        territoire_nom: "Bretagne",
        territoire_nom_affiche: "Bretagne",
        maille: "REG" as const,
        motifs: ["VA non à jour" as const, "VC manquante" as const],
        date_derniere_valeur: "31/03/2026",
        mise_a_jour_attendue_depuis: "30/06/2026",
        derniere_vc_connue: null,
      },
    ];

    // When
    const detail = lignesDetail({ lignes });

    // Then
    const commun = {
      chantier_id: "CH-018",
      chantier_nom: "Accès aux soins",
      indicateur_id: "IND-1",
      indicateur_nom: "Taux de pose",
      territoire_code: "REG-53",
      territoire_nom: "Bretagne",
      territoire_nom_affiche: "Bretagne",
      maille: "REG",
      date_derniere_valeur: "31/03/2026",
      mise_a_jour_attendue_depuis: "30/06/2026",
      derniere_vc_connue: null,
    };
    expect(detail).toEqual([
      { ...commun, motif: "VA non à jour" },
      { ...commun, motif: "VC manquante" },
    ]);
  });
});
