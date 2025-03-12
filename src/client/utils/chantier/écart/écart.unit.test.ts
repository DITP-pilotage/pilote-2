import { definirCouleurEcartArrondi } from '@/client/utils/chantier/écart/écart';

describe('définirCouleurÉcartArrondi', () => {

  test("renvoie \"null\" quand l'écart est inconnu", () => {
    // When
    const couleurÉcartArrondi = definirCouleurEcartArrondi(null);

    // Then
    expect(couleurÉcartArrondi).toStrictEqual(null);
  });

  describe('couleur', () => {
    test("renvoie \"vert\" quand l'écart est supérieur à 10 points", () => {
      // When
      const couleurÉcartArrondi = definirCouleurEcartArrondi(11);

      // Then
      expect(couleurÉcartArrondi).not.toBeNull();
      expect(couleurÉcartArrondi!.couleur).toStrictEqual('vert');
    });

    test("renvoie \"rouge\" quand l'écart est inférieur à -10 points", () => {
      // When
      const couleurÉcartArrondi = definirCouleurEcartArrondi(-15);

      // Then
      expect(couleurÉcartArrondi).not.toBeNull();
      expect(couleurÉcartArrondi!.couleur).toStrictEqual('rouge');
    });

    test("renvoie \"bleu\" quand l'écart est compris entre -10 points et 10 points", () => {
      // When
      const couleurÉcartArrondi = definirCouleurEcartArrondi(0);

      // Then
      expect(couleurÉcartArrondi).not.toBeNull();
      expect(couleurÉcartArrondi!.couleur).toStrictEqual('bleu');
    });
  });

  describe('arrondi', () => {
    test("renvoie l'écart arrondi à un chiffre après la virgule", () => {
      // When
      const couleurÉcartArrondi = definirCouleurEcartArrondi(12.34);

      // Then
      expect(couleurÉcartArrondi).not.toBeNull();
      expect(couleurÉcartArrondi!.ecartArrondi).toStrictEqual(12.3);
    });

    test('renvoie "0" même quand le nombre est négatif', () => {
      // When
      const couleurÉcartArrondi = definirCouleurEcartArrondi(-0.04);

      // Then
      expect(couleurÉcartArrondi).not.toBeNull();
      expect(couleurÉcartArrondi!.ecartArrondi).toStrictEqual(0);
    });
  });
});
