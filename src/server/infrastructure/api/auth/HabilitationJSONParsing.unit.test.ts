import { habilitationPourChantierIds } from '@/server/domain/identité/Habilitation';

describe('Habilitation pour API', () => {
  it('est un objet sérialisable et déserialisable', () => {
    // GIVEN
    const habilitation = habilitationPourChantierIds('CH-001', 'CH-002');

    // WHEN
    const serialisé = JSON.stringify(habilitation);
    const result = JSON.parse(serialisé);

    // THEN
    expect(result).toStrictEqual(habilitation);
  });
});
