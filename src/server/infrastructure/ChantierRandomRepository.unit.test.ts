import ChantierRandomRepository from '@/server/infrastructure/ChantierRandomRepository';

describe('ChantierRandomRepository', () => {
  it('génère n valeurs, avec ids des périmètres définis', async () => {
    // GIVEN
    const idPérimètres = [{ id: 'PER-001' }, { id: 'PER-002' }];
    const nombreDeChantiers = 3;
    const repository = new ChantierRandomRepository(nombreDeChantiers, idPérimètres);

    // WHEN
    const chantiers = await repository.getListe();

    // THEN
    expect(chantiers.length).toBe(3);
    expect(chantiers.map((chantier) => {return chantier.id_périmètre;}))
      .toEqual(expect.arrayContaining(['PER-001', 'PER-002']));
  });
});
