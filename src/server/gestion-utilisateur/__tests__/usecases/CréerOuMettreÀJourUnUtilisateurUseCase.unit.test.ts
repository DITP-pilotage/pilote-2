import { mock } from 'jest-mock-extended';
import PérimètreMinistériel from '@/server/domain/périmètreMinistériel/PérimètreMinistériel.interface';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { fakeTerritoires } from '@/server/domain/territoire/Territoire.builder';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import {
  Habilitations,
  HabilitationsÀCréerOuMettreÀJourCalculées,
} from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import PérimètreMinistérielRepository
  from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import {
  HistorisationModificationRepository,
} from '@/server/domain/historisationModification/HistorisationModificationRepository';
import { Profil } from '@/server/domain/profil/Profil.interface';
import { ProfilBuilder } from '@/server/domain/profil/Profil.builder';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import CréerOuMettreÀJourUnUtilisateurUseCase from '@/server/gestion-utilisateur/usecases/CréerOuMettreÀJourUnUtilisateurUseCase';

describe('CréerOuMettreÀJourUnUtilisateurUseCase', () => {
  const fakeChantiersSynthétisés: ChantierSynthétisé[] = [
    {
      id: '123',
      nom: 'Salut',
      estTerritorialisé: true,
      périmètreIds: ['PER-12'],
      ate: 'hors_ate_deconcentre',
      statut: 'PUBLIE',
    },
    {
      id: '124',
      nom: 'hoo',
      estTerritorialisé: false,
      périmètreIds: ['PER-13'],
      ate: null,
      statut: 'PUBLIE',
    },
  ];

  const fakePérimètres = [
    { id: 'PER-12' },
    { id: 'PER-13' },
    { id: 'PER-018' },
  ] as PérimètreMinistériel[];

  const habilitations = { 
    gestionUtilisateur: { 
      chantiers: fakeChantiersSynthétisés.map(c => c.id), 
      territoires: fakeTerritoires.map(t => t.code), 
    }, 
  } as Habilitations;

  const habilitationsVides =  {
    lecture: {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    'saisieCommentaire': {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    'saisieIndicateur': {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    gestionUtilisateur: {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    responsabilite: {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
  };

  const stubUtilisateurRepository = mock<UtilisateurRepository>();
  const stubUtilisateurIAMRepository = mock<UtilisateurIAMRepository>();
  const stubTerritoireRepository =  mock<TerritoireRepository>();
  const stubChantierRepository = mock<ChantierRepository>();
  const stubPérimètreMinistérielRepository = mock<PérimètreMinistérielRepository>();
  const stubHistorisationModificationRepository = mock<HistorisationModificationRepository>();

  stubTerritoireRepository.récupérerTous.mockResolvedValue(fakeTerritoires as Territoire[]);
  stubChantierRepository.récupérerChantiersSynthétisés.mockResolvedValue(fakeChantiersSynthétisés);
  stubPérimètreMinistérielRepository.récupérerTous.mockResolvedValue(fakePérimètres);

  const créerOuMettreÀJourUnUtilisateurUseCase = new CréerOuMettreÀJourUnUtilisateurUseCase(stubUtilisateurIAMRepository, stubUtilisateurRepository, stubTerritoireRepository, stubChantierRepository, stubPérimètreMinistérielRepository, stubHistorisationModificationRepository);

  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
    process.env.IMPORT_KEYCLOAK_URL = 'https://keycloak.net';
    (stubUtilisateurRepository.créerOuMettreÀJour as jest.Mock).mockClear();
    (stubUtilisateurIAMRepository.ajouteUtilisateurs as jest.Mock).mockClear();
    (stubChantierRepository.récupérerChantiersSynthétisés as jest.Mock).mockClear();
  });
  
  afterEach(() => {
    process.env = oldEnv;
  });

  async function testCasPassant(profilCode: ProfilCode, habilitationsAttendues: HabilitationsÀCréerOuMettreÀJourCalculées, saisieIndicateur: boolean, saisieCommentaire: boolean, gestionUtilisateur: boolean, territoiresCodes?: string[], chantiersIds?: string[], périmètresIds?: string[], chantiersIdsResponsabilite?: string[], profilGestionUtilisateur?: Profil['utilisateurs']) {
    //GIVEN
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecSaisieCommentaire(saisieCommentaire).avecSaisieIndicateur(saisieIndicateur).avecGestionUtilisateur(gestionUtilisateur).avecProfil(profilCode).avecHabilitationsLecture(territoiresCodes, chantiersIds, périmètresIds).avecResponsabiliteChantiers(chantiersIdsResponsabilite).build();
    let profilBuilder = new ProfilBuilder().withCode(profilCode);
    if (profilGestionUtilisateur) {
      profilBuilder.withUtilisateurs(profilGestionUtilisateur);
    }
    const profil = profilBuilder.build();

    //WHEN
    await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto', false, habilitations, profil);
    
    //THEN
    expect(stubUtilisateurRepository.créerOuMettreÀJour).toHaveBeenNthCalledWith(1, { ...utilisateur, habilitations: habilitationsAttendues }, 'toto');
    expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenNthCalledWith(1, [{ nom: utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }]);
  }


  describe("Si la variable d'env IMPORT_KEYCLOAK_URL n'est pas définie", () => {
    it("ne créé pas l'utilisateur sur Keycloak", async () => {
      // GIVEN 
      process.env.IMPORT_KEYCLOAK_URL = undefined;
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil(ProfilEnum.DITP_ADMIN).build();
      const profil = new ProfilBuilder().build();

      //WHEN
      await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto', false, habilitations, profil);
        
      //THEN
      expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenCalledTimes(0);
    });
  });
  
  describe("L'utilisateur a un profil DITP_ADMIN", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant(ProfilEnum.DITP_ADMIN, habilitationsVides, true, true, false);
    });
  });

  describe("L'utilisateur a un profil DITP_PILOTAGE", () => {
    it("Crée l'utilisateur en base de données en lui ajoutant l'habilitation saisie commentaire pour la France", async () => {
      const habilitationsAttendues =  { ...habilitationsVides, 'saisieCommentaire': { territoires: ['NAT-FR'], chantiers: [], périmètres: [] } };
      await testCasPassant(ProfilEnum.DITP_PILOTAGE, habilitationsAttendues, true, true, false);
    });
  });

  describe("L'utilisateur a un profil PR", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant(ProfilEnum.PR, habilitationsVides, true, true, false);
    });
  });


  describe("L'utilisateur a un profil PM_ET_CABINET", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant(ProfilEnum.PM_ET_CABINET, habilitationsVides, true, true, false);
    });
  });

  describe("L'utilisateur a un profil CABINET_MTFP", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant(ProfilEnum.CABINET_MTFP, habilitationsVides, true, true, false);
    });
  });

  describe("L'utilisateur a un profil CABINET_MINISTERIEL", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture sans accorder de droits de saisie", async () => {
      const habilitationsAttendues =  { ...habilitationsVides, lecture: { chantiers: ['123'], territoires: [], périmètres: [] } };
      await testCasPassant(ProfilEnum.CABINET_MINISTERIEL, habilitationsAttendues, false, false, false, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil DIR_ADMIN_CENTRALE", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture sans accorder des droits de saisie", async () => {
      const habilitationsAttendues =  { ...habilitationsVides, lecture: { chantiers: ['123'], territoires: [], périmètres: [] } };
      await testCasPassant(ProfilEnum.DIR_ADMIN_CENTRALE, habilitationsAttendues, false, false, false, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil SECRETARIAT_GENERAL", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie indicateurs et commentaires", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
        'saisieCommentaire': { territoires: [], chantiers: ['123'], périmètres: [] },
        'saisieIndicateur': { territoires: [], chantiers: ['123'], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.SECRETARIAT_GENERAL, habilitationsAttendues, true, true, false, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil EQUIPE_DIR_PROJET", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie indicateurs et commentaires", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
        'saisieCommentaire': { territoires: [], chantiers: ['123'], périmètres: [] },
        'saisieIndicateur': { territoires: [], chantiers: ['123'], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.EQUIPE_DIR_PROJET, habilitationsAttendues, true, true, false, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil DIR_PROJET", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie indicateurs et commentaires", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
        'saisieCommentaire': { territoires: [], chantiers: ['123'], périmètres: [] },
        'saisieIndicateur': { territoires: [], chantiers: ['123'], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.DIR_PROJET, habilitationsAttendues, true, true, false, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil DIR_PROJET", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture et en n'accordant pas les droits de saisie indicateurs et commentaires", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
        'saisieCommentaire': { territoires: [], chantiers: [], périmètres: [] },
        'saisieIndicateur': { territoires: [], chantiers: [], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.DIR_PROJET, habilitationsAttendues, false, false, false, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil ProfilEnum.COORDINATEUR_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture et en accordant les droits de saisie commentaires", async () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
    
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] }, 
        'saisieCommentaire':  { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.COORDINATEUR_REGION, habilitationsAttendues, false, true, false, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
    });

    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture et en accordant les droits de gestion des utilisateurs", async () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
    
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] }, 
        gestionUtilisateur: { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.COORDINATEUR_REGION, habilitationsAttendues, false, false, true, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
    });
  });

  describe("L'utilisateur a un profil PREFET_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture et en accordant les droits de saisie indicateurs et commentaires", async () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);

      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] }, 
        'saisieCommentaire':  { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.PREFET_REGION, habilitationsAttendues, false, true, false, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des régions et leurs départements enfants en lecture et une liste de chantiers territorialisés et une liste de périmètres et en accordant les droits de saisie commentaires", async () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);

      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: ['PER-13'] }, 
        'saisieCommentaire':  { chantiers: ['123'], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: ['PER-13'] },
      };
      await testCasPassant(ProfilEnum.SERVICES_DECONCENTRES_REGION, habilitationsAttendues, false, true, false, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], ['123'], ['PER-13']);
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_REGION et a des responsabilités sur des chantiers", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des régions et leurs départements enfants en lecture et une liste de chantiers territorialisés et une liste de périmètres et en accordant les droits de saisie commentaires et des responsabilités sur des chantiers", async () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);

      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: ['PER-13'] }, 
        'saisieCommentaire':  { chantiers: ['123'], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: ['PER-13'] },
        responsabilite: { chantiers : ['123'], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.SERVICES_DECONCENTRES_REGION, habilitationsAttendues, false, true, false, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], ['123'], ['PER-13'], ['123']);
    });
  });

  describe("L'utilisateur a un profil COORDINATEUR_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements en lecture et en accordant les droits de saisie commentaires", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: ['DEPT-75'], périmètres: [] }, 
        'saisieCommentaire':  { chantiers: [], territoires: ['DEPT-75'], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.COORDINATEUR_DEPARTEMENT, habilitationsAttendues, false, true, false, ['DEPT-75']);
    });
  });


  describe("L'utilisateur a un profil PREFET_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements en lecture et en accordant les droits de saisie commentaires", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: ['DEPT-75'], périmètres: [] }, 
        'saisieCommentaire':  { chantiers: [], territoires: ['DEPT-75'], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.PREFET_DEPARTEMENT, habilitationsAttendues, false, true, false, ['DEPT-75']);
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des départements, une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie commentaires", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: ['DEPT-75'], périmètres: [] }, 
        'saisieCommentaire':  { chantiers: ['123'], territoires: ['DEPT-75'], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT, habilitationsAttendues, false, true, false, ['DEPT-75'], ['123'], []);
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_DEPARTEMENT et a des responsabilités sur des chantiers", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des départements, une liste de chantiers et une liste de périmètres en lecture et en accordant les droits de saisie commentaires et une responsabilite sur un chantier", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: ['DEPT-75'], périmètres: [] }, 
        'saisieCommentaire':  { chantiers: ['123'], territoires: ['DEPT-75'], périmètres: [] },
        responsabilite: { chantiers: ['123'], territoires: ['DEPT-75'], périmètres: [] },
      };
      await testCasPassant(ProfilEnum.SERVICES_DECONCENTRES_DEPARTEMENT, habilitationsAttendues, false, true, false, ['DEPT-75'], ['123'], [], ['123']);
    });
  });

  describe("L'utilisateur a un profil DROM", () => {
    it("Crée l'utilisateur en base de données en lui ajoutant les territoires DROM et le périmètre 18 en lecture, et la France en saisie commentaires", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: codesTerritoiresDROM, périmètres: ['PER-018'] },
        'saisieCommentaire':  { chantiers: [], territoires: ['NAT-FR'], périmètres: ['PER-018'] },
        'saisieIndicateur':  { chantiers: [], territoires: [], périmètres: ['PER-018'] },
      };
      await testCasPassant(ProfilEnum.DROM, habilitationsAttendues, true, true, false);
    });
  });

});
