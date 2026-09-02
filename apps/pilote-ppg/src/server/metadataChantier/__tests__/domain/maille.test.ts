import { calculerMaillesApplicablesIndicateur } from "@/server/metadataChantier/domain/maille";

describe("calculerMaillesApplicablesIndicateur", () => {
  it("retourne uniquement NAT si l'indicateur n'est pas territorialisé", () => {
    // Given / When
    const résultat = calculerMaillesApplicablesIndicateur(false, "DEPT");

    // Then
    expect(résultat).toEqual(["NAT"]);
  });

  it("retourne NAT, REG et DEPT si la maille la plus fine est DEPT", () => {
    // Given / When
    const résultat = calculerMaillesApplicablesIndicateur(true, "DEPT");

    // Then
    expect(résultat).toEqual(["NAT", "REG", "DEPT"]);
  });

  it("retourne NAT et REG si la maille la plus fine est REG", () => {
    // Given / When
    const résultat = calculerMaillesApplicablesIndicateur(true, "REG");

    // Then
    expect(résultat).toEqual(["NAT", "REG"]);
  });

  it("retourne uniquement NAT si la maille la plus fine est NAT", () => {
    // Given / When
    const résultat = calculerMaillesApplicablesIndicateur(true, "NAT");

    // Then
    expect(résultat).toEqual(["NAT"]);
  });

  it("retourne uniquement NAT si territorialisé mais sans maille renseignée", () => {
    // Given / When
    const résultat = calculerMaillesApplicablesIndicateur(true, null);

    // Then
    expect(résultat).toEqual(["NAT"]);
  });
});
