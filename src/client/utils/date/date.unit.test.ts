import { formaterDate } from '@/client/utils/date/date';

describe('formaterDate', () => {

  describe('formate selon le modèle: mm/aaaa', () => {
    it("documente l'attendu pour une date et un horaire", () => {
      const sqldate = '2023-02-13 16:03:56';
      const résultat = formaterDate(sqldate, 'mm/aaaa');
      expect(résultat).toEqual('02/2023');
    });

    it("documente l'attendu pour une date seulement", () => {
      const sqldate = '2023-04-21';
      const résultat = formaterDate(sqldate, 'mm/aaaa');
      expect(résultat).toEqual('04/2023');
    });

    it('renvoie null si la date est invalide car inexistante', () => {
      const sqldate = '2023-99-01';
      const résultat = formaterDate(sqldate, 'mm/aaaa');
      expect(résultat).toEqual(null);
    });

    it('renvoie null si la date est invalide car ne respectant pas le format', () => {
      const sqldate = '2023-0112';
      const résultat = formaterDate(sqldate, 'mm/aaaa');
      expect(résultat).toEqual(null);
    });
  });
  
});
