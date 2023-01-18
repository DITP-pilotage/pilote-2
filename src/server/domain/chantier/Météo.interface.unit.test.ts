import { météoFromString } from '@/server/domain/chantier/Météo.interface';

describe('météoFromString', () => {
  it('Renvoie NON_RENSEIGNEE pour une valeur manquante', () => {
    const result = météoFromString(null);
    expect(result).toEqual('NON_RENSEIGNEE');
  });
  it("Échoue si la valeur n'est pas connue", () => {
    expect(() => météoFromString('VALEUR_INEXISTANTE'))
      .toThrow(/VALEUR_INEXISTANTE/);
  });
});
