import { genererParametresRapportResponsableDonnees } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportResponsableDonnees";

describe("genererParametresRapportResponsableDonnees", () => {
  const chantierInfo = {
    id: "CH-001",
    nom: "Chantier 1",
  };

  it("génère la structure correcte du rapport", () => {
    // Given
    const indicateurs = [
      { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
    ];

    // When
    const result = genererParametresRapportResponsableDonnees(
      chantierInfo,
      indicateurs,
    );

    // Then
    expect(result).toEqual({
      chantiers: [
        {
          nom_chantier: "Chantier 1",
          id_chantier: "CH-001",
          indicateursNonMisAJour: indicateurs,
          nombreIndicateursNonMisAJour: "1 indicateur à mettre à jour",
        },
      ],
    });
  });

  it("utilise le singulier pour nombreIndicateursNonMisAJour avec 1 indicateur", () => {
    // Given
    const indicateurs = [
      { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
    ];

    // When
    const result = genererParametresRapportResponsableDonnees(
      chantierInfo,
      indicateurs,
    );

    // Then
    expect(result.chantiers[0].nombreIndicateursNonMisAJour).toEqual(
      "1 indicateur à mettre à jour",
    );
  });

  it("utilise le pluriel pour nombreIndicateursNonMisAJour avec plusieurs indicateurs", () => {
    // Given
    const indicateurs = [
      { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
      { id: "IND-002", nom: "Indicateur 2", mailles: ["REG"] },
      { id: "IND-003", nom: "Indicateur 3", mailles: ["DEPT"] },
    ];

    // When
    const result = genererParametresRapportResponsableDonnees(
      chantierInfo,
      indicateurs,
    );

    // Then
    expect(result.chantiers[0].nombreIndicateursNonMisAJour).toEqual(
      "3 indicateurs à mettre à jour",
    );
  });
});
