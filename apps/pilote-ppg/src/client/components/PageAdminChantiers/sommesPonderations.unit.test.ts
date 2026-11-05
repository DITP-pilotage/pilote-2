import {
  LignePonderationSomme,
  calculerSommesParMaille,
} from "@/components/PageAdminChantiers/sommesPonderations";

const ligne = (
  overrides: Partial<LignePonderationSomme>,
): LignePonderationSomme => ({
  estActif: true,
  maillesApplicables: ["NAT"],
  poidsPourcentDept: null,
  poidsPourcentReg: null,
  poidsPourcentNat: null,
  ...overrides,
});

describe("calculerSommesParMaille", () => {
  it("ne compte que les indicateurs actifs", () => {
    // Given
    const lignes = [
      ligne({ estActif: true, poidsPourcentNat: 60 }),
      ligne({ estActif: false, poidsPourcentNat: 40 }),
    ];

    // When
    const sommes = calculerSommesParMaille(lignes);

    // Then
    expect(sommes).toEqual({ NAT: 60 });
  });

  it("n'affiche pas de somme pour une maille sans indicateur actif applicable", () => {
    // Given
    const lignes = [
      ligne({
        estActif: false,
        maillesApplicables: ["NAT", "REG"],
        poidsPourcentNat: 50,
        poidsPourcentReg: 100,
      }),
      ligne({ estActif: true, poidsPourcentNat: 50, poidsPourcentReg: 30 }),
    ];

    // When
    const sommes = calculerSommesParMaille(lignes);

    // Then
    expect(sommes).toEqual({ NAT: 50 });
  });

  it("arrondit la somme à deux décimales", () => {
    // Given
    const lignes = [
      ligne({ poidsPourcentNat: 33.33 }),
      ligne({ poidsPourcentNat: 33.33 }),
      ligne({ poidsPourcentNat: 33.34 }),
      ligne({ poidsPourcentNat: 0.1 }),
      ligne({ poidsPourcentNat: 0.2 }),
    ];

    // When
    const sommes = calculerSommesParMaille(lignes);

    // Then
    expect(sommes).toEqual({ NAT: 100.3 });
  });
});
