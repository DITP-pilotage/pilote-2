import { interpolerCouleurs } from '@/client/utils/couleur/couleur';

describe('interpolerCouleur', () => {
  it('pourcentage à 0 : renvoie la couleur de départ', () => {
    const couleurDépart = '#000000';
    const couleurArrivée = '#888888';
    const résultat = interpolerCouleurs(couleurDépart, couleurArrivée, 0);
    expect(résultat).toEqual(couleurDépart);
  });

  it('pourcentage à 100 : renvoie la couleur d\'arrivée', () => {
    const couleurDépart = '#000000';
    const couleurArrivée = '#888888';
    const résultat = interpolerCouleurs(couleurDépart, couleurArrivée, 100);
    expect(résultat).toEqual(couleurArrivée);
  });

  it("pourcentage à 25 : renvoie l'interpolation linéaire à 25% entre la couleur de départ et la couleur d\'arrivée", () => {
    const couleurDépart = '#000000';
    const couleurArrivée = '#888888';
    const résultat = interpolerCouleurs(couleurDépart, couleurArrivée, 25);
    expect(résultat).toEqual('#222222');
  });

  it('pourcentage à 150 : renvoie la couleur d\'arrivée', () => {
    const couleurDépart = '#000000';
    const couleurArrivée = '#888888';
    const résultat = interpolerCouleurs(couleurDépart, couleurArrivée, 125);
    expect(résultat).toEqual(couleurArrivée);
  });

  describe('pourcentage à -20 : renvoie la couleur de départ', () => {
    it('quand la couleur de départ est la plus sombre', () => {
      const couleurDépart = '#000000';
      const couleurArrivée = '#888888';
      const résultat = interpolerCouleurs(couleurDépart, couleurArrivée, -20);
      expect(résultat).toEqual(couleurDépart);
    });

    it('quand la couleur de départ est la plus claire', () => {
      const couleurDépart = '#888888';
      const couleurArrivée = '#000000';
      const résultat = interpolerCouleurs(couleurDépart, couleurArrivée, -20);
      expect(résultat).toEqual(couleurDépart);
    });
  });

});
