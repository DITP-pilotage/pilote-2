import { calculerMoyenne, calculerMédiane, filtrerValeurs } from './statistiques';

describe('statistiques', () => {
  describe('Filtrer valeurs', () => {
    describe('À partir d\'un tableau de nombres et valeurs nulles', () => {
      it('Retourne le tableau de nombres sans valeurs nulles', () => {
        //GIVEN
        const valeursInitiales = [null, 1, 2, null, 3, 4];
        //WHEN
        const résultat = filtrerValeurs(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual([1, 2, 3, 4]);
      });
    });

    describe('À partir d\'un tableau de valeurs uniquement nulles', () => {
      it('Retourne un tabelau vide', () => {
        //GIVEN
        const valeursInitiales = [null, null, null];
        //WHEN
        const résultat = filtrerValeurs(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual([]);
      });
    });

    describe('À partir d\'un tableau vide', () => {
      it('Retourne un tableau vide', () => {
        //GIVEN
        const valeursInitiales: (number | null)[] = [];
        //WHEN
        const résultat = filtrerValeurs(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual([]);
      });
    });
  });


  describe('Calculer moyenne', () => {
    describe('À partir d\'un tableau de nombres et valeurs nulles', () => {
      it('Retourne la moyenne des nombres', () => {
        //GIVEN
        const valeursInitiales = [null, 1, 2, null, 3, 4];
        //WHEN
        const résultat = calculerMoyenne(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual(2.5);
      });
    });

    describe('À partir d\'un tableau de valeurs uniquement nulles', () => {
      it('Retourne null', () => {
        //GIVEN
        const valeursInitiales = [null, null, null];
        //WHEN
        const résultat = calculerMoyenne(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual(null);
      });
    });

    describe('À partir d\'un tableau vide', () => {
      it('Retourne null', () => {
        //GIVEN
        const valeursInitiales: (number | null)[] = [];
        //WHEN
        const résultat = calculerMoyenne(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual(null);
      });
    });
  });

  describe('Calculer médiane', () => {
    describe('À partir d\'un tableau de nombres et valeurs nulles', () => {
      it('Retourne la moyenne des nombres', () => {
        //GIVEN
        const valeursInitiales = [7, null, 2, null, 3, 2, 8, 1, 8];
        //WHEN
        const résultat = calculerMédiane(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual(3);
      });
    });

    describe('À partir d\'un tableau de valeurs uniquement nulles', () => {
      it('Retourne null', () => {
        //GIVEN
        const valeursInitiales = [null, null, null];
        //WHEN
        const résultat = calculerMédiane(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual(null);
      });
    });

    describe('À partir d\'un tableau vide', () => {
      it('Retourne null', () => {
        //GIVEN
        const valeursInitiales: (number | null)[] = [];
        //WHEN
        const résultat = calculerMédiane(valeursInitiales);
        //THEN
        expect(résultat).toStrictEqual(null);
      });
    });
  });

});
