import UtilisateurBuilder from '@/server/domain/utilisateur/Utilisateur.builder';
import { HabilitationBuilder } from '@/server/domain/utilisateur/habilitation/HabilitationBuilder';
import FiltrerListeUtilisateursUseCase from './FiltrerListeUtilisateursUseCase';

describe('FiltrerListeUtilisateursUseCase', () => {
  const habilitationsAdmin = new HabilitationBuilder().build();
  const habilitationReferentRegion = new HabilitationBuilder().avecTerritoireCodesLecture(['REG-84', 'DEPT-69']).build();
  const habilitationReferentDepartement = new HabilitationBuilder().avecTerritoireCodesLecture(['DEPT-01']).build();

  it("quand aucun filtre n'est appliqué et que le profil du créateur est DITP ADMIN retourne tous les utilisateurs", () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder().build(),
      new UtilisateurBuilder().build(),
      new UtilisateurBuilder().build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(utilisateurs.length);
  });

  it("quand aucun filtre n'est appliqué et que le profil du créateur est référent région retourne tous les utilisateurs territoriaux de sa région et ses départements", () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'REFERENT_REGION',
      habilitationReferentRegion,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(2);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-1');
    expect(utilisateursFiltrés[1].id).toStrictEqual('ID-USER-2');
  });

  it("quand aucun filtre n'est appliqué et que le profil du créateur est référent département retourne tous les utilisateurs territoriaux de ses départements", () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-5')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'REFERENT_DEPARTEMENT',
      habilitationReferentDepartement,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(2);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-3');
    expect(utilisateursFiltrés[1].id).toStrictEqual('ID-USER-4');
  });

  it('quand le filtre territoire est appliqué et que le profil du créateur est DITP ADMIN retourne tous les utilisateurs ayant ce territoire', () => {
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
    const utilisateursFiltrésUnique = new FiltrerListeUtilisateursUseCase(
      utilisateurs, 
      {
        territoires: ['DEPT-01'],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();
    const utilisateursFiltrésMultiple = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: ['DEPT-02'],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();
    const utilisateursFiltrésUnion = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: ['DEPT-02', 'DEPT-04'],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();

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
  it('quand le filtre territoire est appliqué et que le profil du créateur est référent région retourne tous les utilisateurs territoriaux de sa région et ses départements ayant le territoire du filtre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: ['DEPT-69'],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'REFERENT_REGION',
      habilitationReferentRegion,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-1');
  });

  it('quand le filtre territoire est appliqué et que le profil du créateur est référent département retourne tous les utilisateurs territoriaux de ses départements ayant le territoire du filtre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69', 'DEPT-01'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: ['DEPT-69'],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'REFERENT_DEPARTEMENT',
      habilitationReferentDepartement,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-1');
  });

  it('quand le filtre chantier est appliqué et que le profil du créateur est DITP ADMIN retourne tous les utilisateurs ayant ce chantier', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-123')
        .avecChantierIdsLecture(['CH-01'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-001')
        .avecChantierIdsLecture(['CH-02', 'CH-03'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-002')
        .avecChantierIdsLecture(['CH-02'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-003')
        .avecChantierIdsLecture(['CH-04'])
        .build(),
    ];

    //WHEN
    const utilisateursFiltrésUnique = new FiltrerListeUtilisateursUseCase(
      utilisateurs, 
      {
        territoires: [],
        chantiers: ['CH-01'],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();
    const utilisateursFiltrésMultiple = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: ['CH-02'],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();
    const utilisateursFiltrésUnion = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: ['CH-02', 'CH-04'],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();

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

  it('quand le filtre chantier est appliqué et que le profil du créateur est référent région retourne tous les utilisateurs territoriaux de sa région et ses départements ayant un chantier du filtre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecChantierIdsLecture(['CH-002'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecChantierIdsLecture(['CH-001'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: ['CH-001'],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'REFERENT_REGION',
      habilitationReferentRegion,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-2');
  });

  it('quand le filtre chantier est appliqué et que le profil du créateur est référent département retourne tous les utilisateurs territoriaux de ses départements ayant un chantier du filtre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecChantierIdsLecture(['CH-002'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecChantierIdsLecture(['CH-001'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-5')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecChantierIdsLecture(['CH-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-6')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecChantierIdsLecture(['CH-002'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: ['CH-001'],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'REFERENT_DEPARTEMENT',
      habilitationReferentDepartement,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-5');
  });

  it('quand le filtre périmètre est appliqué et que le profil du créateur est DITP ADMIN retourne tous les utilisateurs ayant ce périmètre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-123')
        .avecPérimètreIdsLecture(['PER-001'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-001')
        .avecPérimètreIdsLecture(['PER-002', 'PER-003'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-002')
        .avecPérimètreIdsLecture(['PER-002'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-003')
        .avecPérimètreIdsLecture(['PER-004'])
        .build(),
    ];

    //WHEN
    const utilisateursFiltrésUnique = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: ['PER-001'],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();
    const utilisateursFiltrésMultiple = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: ['PER-002'],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();
    const utilisateursFiltrésUnion = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: ['PER-002', 'PER-004'],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();

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

  it('quand le filtre profil et que le profil du créateur est DITP ADMIN est appliqué retourne tous les utilisateurs ayant ce profil', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-123')
        .avecProfil('DITP_ADMIN')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-001')
        .avecProfil('DITP_ADMIN')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-002')
        .avecProfil('DIR_PROJET')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-003')
        .avecProfil('PR')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrésUnique = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: ['PR'],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();
    const utilisateursFiltrésMultiple = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: ['DITP_ADMIN', 'DIR_PROJET'],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();

    //THEN
    expect(utilisateursFiltrésUnique).toHaveLength(1);
    expect(utilisateursFiltrésUnique[0].id).toStrictEqual('ID-USER-003');

    expect(utilisateursFiltrésMultiple).toHaveLength(3);
    expect(utilisateursFiltrésMultiple[0].id).toStrictEqual('ID-USER-123');
    expect(utilisateursFiltrésMultiple[1].id).toStrictEqual('ID-USER-001');
    expect(utilisateursFiltrésMultiple[2].id).toStrictEqual('ID-USER-002');

  });

  it('quand le filtre profil est appliqué et que le profil du créateur est référent région retourne tous les utilisateurs territoriaux de sa région et ses départements ayant le profil du filtre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: ['SERVICES_DECONCENTRES_REGION'],
      },
      'REFERENT_REGION',
      habilitationReferentRegion,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-2');
  });

  it('quand le filtre profil est appliqué et que le profil du créateur est référent région retourne tous les utilisateurs territoriaux de ses départements ayant le profil du filtre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: [],
        chantiersAssociésAuxPérimètres: [],
        profils: ['RESPONSABLE_DEPARTEMENT'],
      },
      'REFERENT_DEPARTEMENT',
      habilitationReferentDepartement,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-1');
  });

  it('quand le filtre périmètre est appliqué et que le profil du créateur est DITP ADMIN retourne tous les utilisateurs ayant ce périmètre ou un chantier associé à ce périmètre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-123')
        .avecChantierIdsLecture(['CH-01'])
        .avecPérimètreIdsLecture(['PER-001'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-001')
        .avecChantierIdsLecture(['CH-02', 'CH-03'])
        .avecPérimètreIdsLecture(['PER-002'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-002')
        .avecChantierIdsLecture(['CH-02'])
        .avecPérimètreIdsLecture([])
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: ['PER-001'],
        chantiersAssociésAuxPérimètres: ['CH-03'],
        profils: [],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(2);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-123');
    expect(utilisateursFiltrés[1].id).toStrictEqual('ID-USER-001');
  });

  it('quand le filtre périmètre est appliqué et que le profil du créateur est référent région retourne tous les utilisateurs territoriaux de sa région et ses départements ayant le périmètre du filtre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecPérimètreIdsLecture(['PER-002'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: ['PER-001'],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'REFERENT_REGION',
      habilitationReferentRegion,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-1');
  });

  it('quand le filtre périmètre est appliqué et que le profil du créateur est référent département retourne tous les utilisateurs territoriaux de ses départements ayant le périmètre du filtre', () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecPérimètreIdsLecture(['PER-002'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-5')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-6')
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecPérimètreIdsLecture(['PER-002'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: [],
        chantiers: [],
        périmètresMinistériels: ['PER-001'],
        chantiersAssociésAuxPérimètres: [],
        profils: [],
      },
      'REFERENT_DEPARTEMENT',
      habilitationReferentDepartement,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-5');
  });

  it("quand les filtres chantier, territoire, périmètre et profils sont appliqués et que le profil du créateur est DITP ADMIN retourne tous les utilisateurs ayant l'intersection entre ce chantier, ce territoire et ce périmètre", () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-123')
        .avecProfil('DITP_ADMIN')
        .avecChantierIdsLecture(['CH-01'])
        .avecTerritoireCodesLecture(['DEPT-01'])
        .avecPérimètreIdsLecture(['PER-001'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-001')
        .avecProfil('DITP_ADMIN')
        .avecChantierIdsLecture(['CH-02', 'CH-03'])
        .avecTerritoireCodesLecture(['DEPT-02'])
        .avecPérimètreIdsLecture(['PER-002'])
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-002')
        .avecProfil('PR')
        .avecChantierIdsLecture(['CH-02'])
        .avecTerritoireCodesLecture(['DEPT-01', 'DEPT-03'])
        .avecPérimètreIdsLecture(['PER-001'])
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: ['DEPT-01'],
        chantiers: ['CH-02'],
        périmètresMinistériels: ['PER-001'],
        chantiersAssociésAuxPérimètres: [],
        profils: ['PR'],
      },
      'DITP_ADMIN',
      habilitationsAdmin,
    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-002');
  });

  it("quand les filtres territoire, chantier, profil et périmètre sont appliqués et que le profil du créateur est référent région retourne tous les utilisateurs territoriaux de sa région et ses départements ayant l'intersection des filtres", () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecPérimètreIdsLecture(['PER-002'])
        .avecChantierIdsLecture(['CH-001'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-5')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-6')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecChantierIdsLecture(['CH-001'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-7')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecChantierIdsLecture(['CH-001'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: ['DEPT-69'],
        chantiers: ['CH-001'],
        périmètresMinistériels: ['PER-001'],
        chantiersAssociésAuxPérimètres: [],
        profils: ['SERVICES_DECONCENTRES_DEPARTEMENT'],
      },
      'REFERENT_REGION',
      habilitationReferentRegion,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-6');
  });

  it("quand les filtres territoire, chantier, profil et périmètre sont appliqués et que le profil du créateur est référent département retourne tous les utilisateurs territoriaux de ses départements ayant l'intersection des filtres", () => {
    //GIVEN
    const utilisateurs = [
      new UtilisateurBuilder()
        .avecId('ID-USER-1')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-2')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecPérimètreIdsLecture(['PER-002'])
        .avecChantierIdsLecture(['CH-001'])
        .avecProfil('SERVICES_DECONCENTRES_REGION')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-3')
        .avecTerritoireCodesLecture(['DEPT-34'])
        .avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-4')
        .avecTerritoireCodesLecture(['REG-84'])
        .avecProfil('DITP_ADMIN')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-5')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-6')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecChantierIdsLecture(['CH-001'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('SERVICES_DECONCENTRES_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-7')
        .avecTerritoireCodesLecture(['DEPT-69'])
        .avecChantierIdsLecture(['CH-001'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
      new UtilisateurBuilder()
        .avecId('ID-USER-8')
        .avecTerritoireCodesLecture(['DEPT-01', 'DEPT-69'])
        .avecChantierIdsLecture(['CH-001'])
        .avecPérimètreIdsLecture(['PER-001'])
        .avecProfil('RESPONSABLE_DEPARTEMENT')
        .build(),
    ];

    //WHEN
    const utilisateursFiltrés = new FiltrerListeUtilisateursUseCase(
      utilisateurs,
      {
        territoires: ['DEPT-69'],
        chantiers: ['CH-001'],
        périmètresMinistériels: ['PER-001'],
        chantiersAssociésAuxPérimètres: [],
        profils: ['RESPONSABLE_DEPARTEMENT'],
      },
      'REFERENT_DEPARTEMENT',
      habilitationReferentDepartement,

    ).run();

    //THEN
    expect(utilisateursFiltrés).toHaveLength(1);
    expect(utilisateursFiltrés[0].id).toStrictEqual('ID-USER-8');
  });

});
