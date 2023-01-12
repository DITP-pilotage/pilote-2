import { météoFromString } from '@/server/domain/chantier/Météo.interface';

describe('météoFromString', () => {
  it('Renvoie null pour une météo non renseignée', () => {
    const result = météoFromString('NON_RENSEIGNE');
    expect(result).toBeNull();
  });

  it("Échoue si la valeur n'est pas connue", () => {
    expect(() => météoFromString('VALEUR_INEXISTANTE'))
      .toThrow(/VALEUR_INEXISTANTE/);
  });
});
