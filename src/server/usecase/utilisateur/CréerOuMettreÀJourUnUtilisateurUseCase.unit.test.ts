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
import { Habilitations, HabilitationsÀCréerOuMettreÀJourCalculées } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import PérimètreMinistérielRepository from '@/server/domain/périmètreMinistériel/PérimètreMinistérielRepository.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import CréerOuMettreÀJourUnUtilisateurUseCase from './CréerOuMettreÀJourUnUtilisateurUseCase';

describe('CréerOuMettreÀJourUnUtilisateurUseCase', () => {
  const fakeChantiersSynthétisés: ChantierSynthétisé[] = [
    {
      id: '123',
      nom: 'Salut',
      estTerritorialisé: true,
      périmètreIds: ['PER-12'],
      ate: 'hors_ate_deconcentre',
    },
    {
      id: '124',
      nom: 'hoo',
      estTerritorialisé: false,
      périmètreIds: ['PER-13'],
      ate: null,
    },
  ];

  const fakePérimètres = [
    { id: 'PER-12' },
    { id: 'PER-13' },
    { id: 'PER-018' },
  ] as PérimètreMinistériel[];

  const habilitations = { 
    'utilisateurs.modification': { 
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
    'saisie.commentaire': {
      chantiers: [],
      périmètres: [],
      territoires: [],
    },
    'saisie.indicateur': {
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

  stubTerritoireRepository.récupérerTous.mockResolvedValue(fakeTerritoires as Territoire[]);
  stubChantierRepository.récupérerChantiersSynthétisés.mockResolvedValue(fakeChantiersSynthétisés);
  stubPérimètreMinistérielRepository.récupérerTous.mockResolvedValue(fakePérimètres);

  const créerOuMettreÀJourUnUtilisateurUseCase = new CréerOuMettreÀJourUnUtilisateurUseCase(stubUtilisateurIAMRepository, stubUtilisateurRepository, stubTerritoireRepository, stubChantierRepository, stubPérimètreMinistérielRepository);

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

  async function testCasPassant(profilCode: ProfilCode, habilitationsAttendues: HabilitationsÀCréerOuMettreÀJourCalculées, territoiresCodes?: string[], chantiersIds?: string[], périmètresIds?: string[]) {
    //GIVEN
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil(profilCode).avecHabilitationsLecture(territoiresCodes, chantiersIds, périmètresIds).build();
    
    //WHEN
    await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto', false, habilitations);
    
    //THEN
    expect(stubUtilisateurRepository.créerOuMettreÀJour).toHaveBeenNthCalledWith(1, { ...utilisateur, habilitations: habilitationsAttendues }, 'toto');
    expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenNthCalledWith(1, [{ nom: utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }]);
  }


  describe("Si la variable d'env IMPORT_KEYCLOAK_URL n'est pas définie", () => {
    it("ne créé pas l'utilisateur sur Keycloak", async () => {
      // GIVEN 
      process.env.IMPORT_KEYCLOAK_URL = undefined;
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil('DITP_ADMIN').build();

      //WHEN
      await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto', false, habilitations);
        
      //THEN
      expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenCalledTimes(0);
    });
  });
  
  describe("L'utilisateur a un profil DITP_ADMIN", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant('DITP_ADMIN', habilitationsVides);
    });
  });

  describe("L'utilisateur a un profil DITP_PILOTAGE", () => {
    it("Crée l'utilisateur en base de données en lui ajoutant l'habilitation saisie commentaire pour la France", async () => {
      const habilitationsAttendues =  { ...habilitationsVides, 'saisie.commentaire': { territoires: ['NAT-FR'], chantiers: [], périmètres: [] } };
      await testCasPassant('DITP_PILOTAGE', habilitationsAttendues);
    });
  });

  describe("L'utilisateur a un profil PR", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant('PR', habilitationsVides);
    });
  });


  describe("L'utilisateur a un profil PM_ET_CABINET", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant('PM_ET_CABINET', habilitationsVides);
    });
  });

  describe("L'utilisateur a un profil CABINET_MTFP", () => {
    it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
      await testCasPassant('CABINET_MTFP', habilitationsVides);
    });
  });

  describe("L'utilisateur a un profil CABINET_MINISTERIEL", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture", async () => {
      const habilitationsAttendues =  { ...habilitationsVides, lecture: { chantiers: ['123'], territoires: [], périmètres: [] } };
      await testCasPassant('CABINET_MINISTERIEL', habilitationsAttendues, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil DIR_ADMIN_CENTRALE", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture", async () => {
      const habilitationsAttendues =  { ...habilitationsVides, lecture: { chantiers: ['123'], territoires: [], périmètres: [] } };
      await testCasPassant('DIR_ADMIN_CENTRALE', habilitationsAttendues, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil SECRETARIAT_GENERAL", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture, et en lui ajoutant la saisie commentaires pour la France", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
        'saisie.commentaire': { territoires: ['NAT-FR'], chantiers: ['123'], périmètres: [] },
        'saisie.indicateur': { territoires: [], chantiers: ['123'], périmètres: [] },
      };
      await testCasPassant('SECRETARIAT_GENERAL', habilitationsAttendues, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil EQUIPE_DIR_PROJET", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture, et en lui ajoutant la saisie commentaires pour la France", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
        'saisie.commentaire': { territoires: ['NAT-FR'], chantiers: ['123'], périmètres: [] },
        'saisie.indicateur': { territoires: [], chantiers: ['123'], périmètres: [] },
      };
      await testCasPassant('EQUIPE_DIR_PROJET', habilitationsAttendues, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil DIR_PROJET", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture, et en lui ajoutant la saisie commentaires pour la France", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
        'saisie.commentaire': { territoires: ['NAT-FR'], chantiers: ['123'], périmètres: [] },
        'saisie.indicateur': { territoires: [], chantiers: ['123'], périmètres: [] },
      };
      await testCasPassant('DIR_PROJET', habilitationsAttendues, undefined, ['123'], []);
    });
  });

  describe("L'utilisateur a un profil REFERENT_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture", async () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
    
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] }, 
        'saisie.commentaire':  { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
      };
      await testCasPassant('REFERENT_REGION', habilitationsAttendues, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
    });
  });

  describe("L'utilisateur a un profil PREFET_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture", async () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);

      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] }, 
        'saisie.commentaire':  { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
      };
      await testCasPassant('PREFET_REGION', habilitationsAttendues, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_REGION", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des régions et leurs départements enfants en lecture et une liste de chantiers territorialisés et une liste de périmètres", async () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);

      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: ['PER-13'] }, 
        'saisie.commentaire':  { chantiers: ['123'], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: ['PER-13'] },
      };
      await testCasPassant('SERVICES_DECONCENTRES_REGION', habilitationsAttendues, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], ['123'], ['PER-13']);
    });
  });

  describe("L'utilisateur a un profil REFERENT_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements en lecture", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: ['DEPT-75'], périmètres: [] }, 
        'saisie.commentaire':  { chantiers: [], territoires: ['DEPT-75'], périmètres: [] },
      };
      await testCasPassant('REFERENT_DEPARTEMENT', habilitationsAttendues, ['DEPT-75']);
    });
  });


  describe("L'utilisateur a un profil PREFET_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements en lecture", async () => {
      const habilitationsAttendues = { 
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: ['DEPT-75'], périmètres: [] }, 
        'saisie.commentaire':  { chantiers: [], territoires: ['DEPT-75'], périmètres: [] },
      };
      await testCasPassant('PREFET_DEPARTEMENT', habilitationsAttendues, ['DEPT-75']);
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_DEPARTEMENT", () => {
    it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des départements, une liste de chantiers et une liste de périmètres en lecture", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides, 
        lecture: { chantiers: ['123'], territoires: ['DEPT-75'], périmètres: [] }, 
        'saisie.commentaire':  { chantiers: ['123'], territoires: ['DEPT-75'], périmètres: [] },
      };
      await testCasPassant('SERVICES_DECONCENTRES_DEPARTEMENT', habilitationsAttendues, ['DEPT-75'], ['123'], []);
    });
  });

  describe("L'utilisateur a un profil DROM", () => {
    it("Crée l'utilisateur en base de données en lui ajoutant les territoires DROM et le périmètre 18 en lecture, et la France en saisie commentaires", async () => {
      const habilitationsAttendues = {
        ...habilitationsVides, 
        lecture: { chantiers: [], territoires: codesTerritoiresDROM, périmètres: ['PER-018'] },
        'saisie.commentaire':  { chantiers: [], territoires: ['NAT-FR'], périmètres: ['PER-018'] },
        'saisie.indicateur':  { chantiers: [], territoires: [], périmètres: ['PER-018'] },
      };
      await testCasPassant('DROM', habilitationsAttendues);
    });
  });
});
