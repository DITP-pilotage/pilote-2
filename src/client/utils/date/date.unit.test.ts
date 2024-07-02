import { comparerDateDeMàjDonnées, formaterDate } from '@/client/utils/date/date';

describe('formaterDate', () => {

  describe('renvoie null si l\'entrée est invalide', () => {
    it('quand la date est invalide car inexistante', () => {
      const date = '2023-99-01';
      const résultat = formaterDate(date, 'DD/MM/YYYY');
      expect(résultat).toEqual(null);
    });

    it('quand la date est invalide car ne respectant pas le format', () => {
      const date = '2023-0112';
      const résultat = formaterDate(date, 'DD/MM/YYYY');
      expect(résultat).toEqual(null);
    });
  });

  describe('formate selon le modèle: MM/YYYY', () => {
    it("documente l'attendu pour une date et un horaire", () => {
      const dateTime = '2023-02-13T16:03:56.000Z';
      const résultat = formaterDate(dateTime, 'MM/YYYY');
      expect(résultat).toEqual('02/2023');
    });

    it("documente l'attendu pour une date seulement", () => {
      const date = '2023-04-21';
      const résultat = formaterDate(date, 'MM/YYYY');
      expect(résultat).toEqual('04/2023');
    });
  });

  describe('formate selon le modèle: DD/MM/YYYY', () => {
    it("documente l'attendu pour une date et un horaire", () => {
      const dateTime = '2023-02-13T16:03:56.000Z';
      const résultat = formaterDate(dateTime, 'DD/MM/YYYY');
      expect(résultat).toEqual('13/02/2023');
    });

    it("documente l'attendu pour une date seulement", () => {
      const dateTime = '2023-04-21';
      const résultat = formaterDate(dateTime, 'DD/MM/YYYY');
      expect(résultat).toEqual('21/04/2023');
    });
  });
  
});

describe('comparerDateDeMàjDonnées', () => {
  test('retourne 0 si les dates sont identiques', () => {
    // GIVEN
    const météoA = '2024-06-20T15:42:20.000Z';
    const météoB = '2024-06-20T15:42:20.000Z';

    // WHEN
    const comparaison = comparerDateDeMàjDonnées(météoA, météoB, [{ desc: true, id: '1' }]);

    // THEN
    expect(comparaison).toStrictEqual(0);
  });

  test('retourne -1 si la date A est supérieure à la date B', () => {
    // GIVEN
    const météoA = '2024-06-20T15:42:20.000Z';
    const météoB = '2024-06-19T15:42:20.000Z';

    // WHEN
    const comparaison = comparerDateDeMàjDonnées(météoA, météoB, [{ desc: true, id: '1' }]);

    // THEN
    expect(comparaison).toStrictEqual(-1);
  });

  test('retourne 1 si la date A est inférieure la date B', () => {
    // GIVEN
    const météoA = '2024-06-19T15:42:20.000Z';
    const météoB = '2024-06-20T15:42:20.000Z';

    // WHEN
    const comparaison = comparerDateDeMàjDonnées(météoA, météoB, [{ desc: true, id: '1' }]);

    // THEN
    expect(comparaison).toStrictEqual(1);
  });

  test('retourne -1 si la date A est null et tri par ordre décroissant', () => {
    // GIVEN
    const météoA = null;
    const météoB = '2024-06-19T15:42:20.000Z';

    // WHEN
    const comparaison = comparerDateDeMàjDonnées(météoA, météoB, [{ desc: true, id: '1' }]);

    // THEN
    expect(comparaison).toStrictEqual(-1);
  });

  test('retourne 1 si la date B est null et tri par ordre croissant', () => {
    // GIVEN
    const météoA = '2024-06-19T15:42:20.000Z';
    const météoB = null;

    // WHEN
    const comparaison = comparerDateDeMàjDonnées(météoA, météoB, [{ desc: true, id: '1' }]);

    // THEN
    expect(comparaison).toStrictEqual(1);
  });
});
