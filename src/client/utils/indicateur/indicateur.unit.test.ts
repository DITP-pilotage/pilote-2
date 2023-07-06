import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import IndicateurBuilder from '@/server/domain/indicateur/Indicateur.builder';

describe('comparerIndicateur', () => {
  it('renvoie 0 si le type et le nom sont strictement identiques', () => {
    // given
    const a = new IndicateurBuilder().avecNom('Indicateur 1').avecType('CONTEXTE').build();
    const b = new IndicateurBuilder().avecNom('Indicateur 1').avecType('CONTEXTE').build();

    // when
    const résultat = comparerIndicateur(a, b);

    // then
    expect(résultat).toStrictEqual(0);
  });

  it("renvoie -1 si le type est identique mais que le nom de A est avant le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder().avecNom('Indicateur A').avecType('CONTEXTE').build();
    const b = new IndicateurBuilder().avecNom('Indicateur B').avecType('CONTEXTE').build();

    // when
    const résultat = comparerIndicateur(a, b);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it("renvoie 1 si le type est identique mais que le nom de A est après le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder().avecNom('Indicateur Z28').avecType('CONTEXTE').build();
    const b = new IndicateurBuilder().avecNom('Indicateur R01').avecType('CONTEXTE').build();

    // when
    const résultat = comparerIndicateur(a, b);

    // then
    expect(résultat).toStrictEqual(1);
  });

  it("renvoie -1 si, dans l'ordre décroissant d'importance, le type de A est avant le type de B", () => {
    // given
    const a = new IndicateurBuilder().avecType('IMPACT').build();
    const b = new IndicateurBuilder().avecType('DEPL').build();
    const c = new IndicateurBuilder().avecType('Q_SERV').build();
    const d = new IndicateurBuilder().avecType('REBOND').build();
    const e = new IndicateurBuilder().avecType('CONTEXTE').build();

    // when
    const résultatAB = comparerIndicateur(a, b);
    const résultatBC = comparerIndicateur(b, c);
    const résultatCD = comparerIndicateur(c, d);
    const résultatDE = comparerIndicateur(d, e);

    // then
    expect(résultatAB).toStrictEqual(-1);
    expect(résultatBC).toStrictEqual(-1);
    expect(résultatCD).toStrictEqual(-1);
    expect(résultatDE).toStrictEqual(-1);
  });

  it("renvoie 1 si, dans l'ordre décroissant d'importance, le type de A est après le type de B", () => {
    // given
    const a = new IndicateurBuilder().avecType('CONTEXTE').build();
    const b = new IndicateurBuilder().avecType('IMPACT').build();

    // when
    const résultat = comparerIndicateur(a, b);

    // then
    expect(résultat).toStrictEqual(1);
  });
});
