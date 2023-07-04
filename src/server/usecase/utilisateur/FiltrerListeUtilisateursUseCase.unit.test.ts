import UtilisateurBuilder from '@/server/domain/utilisateur/Utilisateur.builder';
import FiltrerListeUtilisateursUseCase from './FiltrerListeUtilisateursUseCase';

describe('FiltrerListeUtilisateursUseCase', () => {
  it("quand aucun filtre n'est appliqé retourne tous les utilisateurs", () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder().build(),
      new UtilisateurBuilder().build(),
      new UtilisateurBuilder().build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(utilisateurs, []).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(utilisateurs.length);
  });

  it('quand le filtre territoire est appliqé retourne tous les utilisateurs ayant ce territoire', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-123')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-001')
        .avecTerritoireCodesLecture(['DEPT-02', 'DEPT-03'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-002')
        .avecTerritoireCodesLecture(['DEPT-02'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-003')
        .avecTerritoireCodesLecture(['DEPT-04'])
        .build(),
    ];

    //WHEN
    const utilisateursFiltrésUnique = new FiltrerListeUtilisateursUseCase(utilisateurs, ['DEPT-01']).run();
    const utilisateursFiltrésMultiple = new FiltrerListeUtilisateursUseCase(utilisateurs, ['DEPT-02']).run();
    const utilisateursFiltrésUnion = new FiltrerListeUtilisateursUseCase(utilisateurs, ['DEPT-02', 'DEPT-04']).run();

    //THEN
    expect(utilisateursFiltrésUnique).toHaveLength(1);
    expect(utilisateursFiltrésUnique[0].id).toStrictEqual('ID-USER-123');

    expect(utilisateursFiltrésMultiple).toHaveLength(2);
    expect(utilisateursFiltrésMultiple[0].id).toStrictEqual('ID-USER-001');
    expect(utilisateursFiltrésMultiple[1].id).toStrictEqual('ID-USER-002');

    expect(utilisateursFiltrésUnion).toHaveLength(3);
    expect(utilisateursFiltrésUnion[0].id).toStrictEqual('ID-USER-001');
    expect(utilisateursFiltrésUnion[1].id).toStrictEqual('ID-USER-002');
    expect(utilisateursFiltrésUnion[2].id).toStrictEqual('ID-USER-003');
  });
});
