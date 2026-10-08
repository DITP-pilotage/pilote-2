import { calculerMaillesApplicablesIndicateur } from "@/server/parametrage-chantier/domain/maille";

describe("calculerMaillesApplicablesIndicateur", () => {
  it("retourne uniquement NAT si l'indicateur n'est pas territorialisé", () => {
    // Given / When
    const result = calculerMaillesApplicablesIndicateur(false, "DEPT");

    // Then
    expect(result).toEqual(["NAT"]);
  });

  it("retourne NAT, REG et DEPT si la maille la plus fine est DEPT", () => {
    // Given / When
    const result = calculerMaillesApplicablesIndicateur(true, "DEPT");

    // Then
    expect(result).toEqual(["NAT", "REG", "DEPT"]);
  });

  it("retourne NAT et REG si la maille la plus fine est REG", () => {
    // Given / When
    const result = calculerMaillesApplicablesIndicateur(true, "REG");

    // Then
    expect(result).toEqual(["NAT", "REG"]);
  });

  it("retourne uniquement NAT si la maille la plus fine est NAT", () => {
    // Given / When
    const result = calculerMaillesApplicablesIndicateur(true, "NAT");

    // Then
    expect(result).toEqual(["NAT"]);
  });

  it("retourne uniquement NAT si territorialisé mais sans maille renseignée", () => {
    // Given / When
    const result = calculerMaillesApplicablesIndicateur(true, null);

    // Then
    expect(result).toEqual(["NAT"]);
  });
});
