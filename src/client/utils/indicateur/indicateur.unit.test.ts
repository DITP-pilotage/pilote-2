import { comparerIndicateur } from "@/client/utils/indicateur/indicateur";
import IndicateurBuilder from "@/server/domain/indicateur/Indicateur.builder";

describe("comparerIndicateur", () => {
  it("renvoie 0 si les pondérations et le nom sont strictement identiques", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur 1").build();
    const b = new IndicateurBuilder().avecNom("Indicateur 1").build();

    const pondérationA = null;
    const pondérationB = null;

    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(0);
  });

  it("renvoie -1 si les pondération sont identiques mais que le nom de A est avant le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur A").build();
    const b = new IndicateurBuilder().avecNom("Indicateur B").build();

    const pondérationA = null;
    const pondérationB = null;

    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it("renvoie 1 si les pondérations sont identiques mais que le nom de A est après le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur Z28").build();
    const b = new IndicateurBuilder().avecNom("Indicateur R01").build();

    const pondérationA = null;
    const pondérationB = null;

    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(1);
  });

  it("renvoie 1 si la pondération de A est null et la pondération de B est non null", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur A").build();
    const b = new IndicateurBuilder().avecNom("Indicateur B").build();

    const pondérationA = null;
    const pondérationB = 10;
    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(1);
  });

  it("renvoie -1 si la pondération de A est non null et la pondération de B est null", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur A").build();
    const b = new IndicateurBuilder().avecNom("Indicateur B").build();

    const pondérationA = 12;
    const pondérationB = null;

    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it("renvoie -1 si la pondération de A est supérieure à la pondération de B", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur A").build();
    const b = new IndicateurBuilder().avecNom("Indicateur B").build();

    const pondérationA = 12;
    const pondérationB = 10;

    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it("renvoie 1 si la pondération de A est inférieure à la pondération de B", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur A").build();
    const b = new IndicateurBuilder().avecNom("Indicateur B").build();

    const pondérationA = 8;
    const pondérationB = 10;
    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(1);
  });

  it("renvoie -1 si la pondération de A est égale à la pondération de B et que le nom de A est avant le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur A").build();
    const b = new IndicateurBuilder().avecNom("Indicateur B").build();

    const pondérationA = 10;
    const pondérationB = 10;

    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it("renvoie 1 si la pondération de A est égale à la pondération de B et que le nom de A est après le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder().avecNom("Indicateur ZA").build();
    const b = new IndicateurBuilder().avecNom("Indicateur B").build();

    const pondérationA = 10;
    const pondérationB = 10;

    // when
    const résultat = comparerIndicateur(a, b, pondérationA, pondérationB);

    // then
    expect(résultat).toStrictEqual(1);
  });
});
