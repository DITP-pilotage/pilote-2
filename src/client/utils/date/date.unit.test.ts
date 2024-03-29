import { formaterDate } from '@/client/utils/date/date';

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
