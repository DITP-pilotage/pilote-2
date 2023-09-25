import { comparerIndicateur } from '@/client/utils/indicateur/indicateur';
import IndicateurBuilder from '@/server/domain/indicateur/Indicateur.builder';

describe('comparerIndicateur', () => {
  const maille = 'nationale';
  it('renvoie 0 si le type et le nom sont strictement identiques', () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur 1')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: null, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur 1')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: null, 'régionale': null, 'départementale': null })
      .build();
    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(0);
  });

  it("renvoie -1 si le type est identique mais que le nom de A est avant le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur A')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: null, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur B')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: null, 'régionale': null, 'départementale': null })
      .build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it("renvoie 1 si le type est identique mais que le nom de A est après le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur Z28')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: null, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur R01')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: null, 'régionale': null, 'départementale': null })
      .build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(1);
  });

  it("renvoie -1 si, dans l'ordre décroissant d'importance, le type de A est avant le type de B", () => {
    // given
    const a = new IndicateurBuilder().avecType('IMPACT').avecPondération({ nationale: null, 'régionale': null, 'départementale': null }).build();
    const b = new IndicateurBuilder().avecType('DEPL').avecPondération({ nationale: null, 'régionale': null, 'départementale': null }).build();
    const c = new IndicateurBuilder().avecType('Q_SERV').avecPondération({ nationale: null, 'régionale': null, 'départementale': null }).build();
    const d = new IndicateurBuilder().avecType('REBOND').avecPondération({ nationale: null, 'régionale': null, 'départementale': null }).build();
    const e = new IndicateurBuilder().avecType('CONTEXTE').avecPondération({ nationale: null, 'régionale': null, 'départementale': null }).build();

    // when
    const résultatAB = comparerIndicateur(a, b, maille);
    const résultatBC = comparerIndicateur(b, c, maille);
    const résultatCD = comparerIndicateur(c, d, maille);
    const résultatDE = comparerIndicateur(d, e, maille);

    // then
    expect(résultatAB).toStrictEqual(-1);
    expect(résultatBC).toStrictEqual(-1);
    expect(résultatCD).toStrictEqual(-1);
    expect(résultatDE).toStrictEqual(-1);
  });

  it("renvoie 1 si, dans l'ordre décroissant d'importance, le type de A est après le type de B", () => {
    // given
    const a = new IndicateurBuilder().avecType('CONTEXTE').avecPondération({ nationale: null, 'régionale': null, 'départementale': null }).build();
    const b = new IndicateurBuilder().avecType('IMPACT').avecPondération({ nationale: null, 'régionale': null, 'départementale': null }).build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(1);
  });

  it('renvoie 1 si la pondération de A est null et la pondération de B est non null', () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur A')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: null, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur B')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 12, 'régionale': null, 'départementale': null })
      .build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(1);
  });

  it('renvoie -1 si la pondération de A est non et la pondération de B est null', () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur A')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 12, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur B')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: null, 'régionale': null, 'départementale': null })
      .build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it('renvoie -1 si la pondération de A est supérieure à la pondération de B', () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur A')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 12, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur B')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 10, 'régionale': null, 'départementale': null })
      .build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it('renvoie 1 si la pondération de A est inférieure à la pondération de B', () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur A')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 8, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur B')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 10, 'régionale': null, 'départementale': null })
      .build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(1);
  });

  it("renvoie -1 si la pondération de A est égale à la pondération de B et que le nom de A est avant le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur A')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 10, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur B')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 10, 'régionale': null, 'départementale': null })
      .build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(-1);
  });

  it("renvoie 1 si la pondération de A est égale à la pondération de B et que le nom de A est après le nom de B dans l'ordre alphabétique", () => {
    // given
    const a = new IndicateurBuilder()
      .avecNom('Indicateur ZA')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 10, 'régionale': null, 'départementale': null })
      .build();
    const b = new IndicateurBuilder()
      .avecNom('Indicateur B')
      .avecType('CONTEXTE')
      .avecPondération({ nationale: 10, 'régionale': null, 'départementale': null })
      .build();

    // when
    const résultat = comparerIndicateur(a, b, maille);

    // then
    expect(résultat).toStrictEqual(1);
  });

});
