import { mock } from 'jest-mock-extended';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { fakeTerritoires } from '@/server/domain/territoire/Territoire.builder';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
import { HabilitationsÀCréerOuMettreÀJourCalculées } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';
import CréerOuMettreÀJourUnUtilisateurUseCase from './CréerOuMettreÀJourUnUtilisateurUseCase';

describe('CréerOuMettreÀJourUnUtilisateurUseCase', () => {
  const fakeChantiersSynthétisés: ChantierSynthétisé[] = [
    {
      id: '123',
      nom: 'Salut',
      estTerritorialisé: true,
      périmètreIds: ['PER-12'],
    },
    {
      id: '124',
      nom: 'hoo',
      estTerritorialisé: false,
      périmètreIds: ['PER-13'],
    },
  ];

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

  const stubUtilisateurRepository = { créerOuMettreÀJour: jest.fn() } as unknown as UtilisateurRepository;
  const stubUtilisateurIAMRepository = { ajouteUtilisateurs: jest.fn() } as unknown as UtilisateurIAMRepository;
  const stubTerritoireRepository = { récupérerTous: jest.fn().mockResolvedValue(fakeTerritoires) } as unknown as TerritoireRepository;
  const stubChantierRepository = mock<ChantierRepository>();
  stubChantierRepository.récupérerChantiersSynthétisés.mockResolvedValue(fakeChantiersSynthétisés);

  const créerOuMettreÀJourUnUtilisateurUseCase = new CréerOuMettreÀJourUnUtilisateurUseCase(stubUtilisateurRepository, stubUtilisateurIAMRepository, stubTerritoireRepository, stubChantierRepository);

  const oldEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv };
    process.env.DEV_PASSWORD = undefined;
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
    await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto');
    
    //THEN
    expect(stubUtilisateurRepository.créerOuMettreÀJour).toHaveBeenNthCalledWith(1, { ...utilisateur, habilitations: habilitationsAttendues }, 'toto');
    expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenNthCalledWith(1, [{ nom: utilisateur.nom, prénom: utilisateur.prénom, email: utilisateur.email }]);
  }

  async function testCasErreur(profilCode: ProfilCode, territoiresCodes?: string[], chantiersIds?: string[], périmètresIds?: string[]) {
    // GIVEN
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil(profilCode).avecHabilitationsLecture(territoiresCodes, chantiersIds, périmètresIds).build();

    // THEN
    await expect(créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto')).rejects.toThrowError();
  }

  describe("Si la variable d'env DEV_PASSWORD est définie", () => {
    it("ne créé par l'utilisateur sur Keycloak", async () => {
      // GIVEN 
      process.env.DEV_PASSWORD = 'password';
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil('DITP_ADMIN').build();

      //WHEN
      await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto');
        
      //THEN
      expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenCalledTimes(0);
    });
  });
  
  describe("L'utilisateur a un profil DITP_ADMIN", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
        await testCasPassant('DITP_ADMIN', habilitationsVides);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('DITP_ADMIN', ['REG-006']);
      }); 
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('DITP_ADMIN', undefined, ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('DITP_ADMIN', undefined, undefined, ['456']);
      }); 
    });
  });

  describe("L'utilisateur a un profil DITP_PILOTAGE", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en lui ajoutant l'habilitation saisie commentaire pour la France", async () => {
        const habilitationsAttendues =  { ...habilitationsVides, 'saisie.commentaire': { territoires: ['NAT-FR'], chantiers: [], périmètres: [] } };
        await testCasPassant('DITP_PILOTAGE', habilitationsAttendues);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('DITP_PILOTAGE', ['REG-006']);
      }); 
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('DITP_PILOTAGE', undefined, ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('DITP_PILOTAGE', undefined, undefined, ['456']);
      }); 
    });
  });

  describe("L'utilisateur a un profil PR", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
        await testCasPassant('PR', habilitationsVides);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('PR', ['REG-006']);
      }); 
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('PR', undefined, ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('PR', undefined, undefined, ['456']);
      }); 
    });
  });


  describe("L'utilisateur a un profil PM_ET_CABINET", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
        await testCasPassant('PM_ET_CABINET', habilitationsVides);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('PM_ET_CABINET', ['REG-006']);
      }); 
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('PM_ET_CABINET', undefined, ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('PM_ET_CABINET', undefined, undefined, ['456']);
      }); 
    });
  });

  describe("L'utilisateur a un profil CABINET_MTFP", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données sans lui ajouter d'habilitations", async () => {
        await testCasPassant('CABINET_MTFP', habilitationsVides);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('CABINET_MTFP', ['REG-006']);
      }); 
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('CABINET_MTFP', undefined, ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('CABINET_MTFP', undefined, undefined, ['456']);
      }); 
    });
  });

  describe("L'utilisateur a un profil CABINET_MINISTERIEL", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture", async () => {
        const habilitationsAttendues =  { ...habilitationsVides, lecture: { chantiers: ['123'], territoires: [], périmètres: [] } };
        await testCasPassant('CABINET_MINISTERIEL', habilitationsAttendues, undefined, ['123'], []);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('CABINET_MINISTERIEL', ['REG-006']);
      }); 
    });
  });

  describe("L'utilisateur a un profil DIR_ADMIN_CENTRALE", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture", async () => {
        const habilitationsAttendues =  { ...habilitationsVides, lecture: { chantiers: ['123'], territoires: [], périmètres: [] } };
        await testCasPassant('DIR_ADMIN_CENTRALE', habilitationsAttendues, undefined, ['123'], []);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('DIR_ADMIN_CENTRALE', ['REG-006']);
      }); 
    });
  });

  describe("L'utilisateur a un profil SECRETARIAT_GENERAL", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture, et en lui ajoutant la saisie commentaires pour la France", async () => {
        const habilitationsAttendues = {
          ...habilitationsVides, 
          lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
          'saisie.commentaire': { territoires: ['NAT-FR'], chantiers: [], périmètres: [] },
        };
        await testCasPassant('SECRETARIAT_GENERAL', habilitationsAttendues, undefined, ['123'], []);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('SECRETARIAT_GENERAL', ['REG-006']);
      }); 
    });
  });

  describe("L'utilisateur a un profil EQUIPE_DIR_PROJET", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture, et en lui ajoutant la saisie commentaires pour la France", async () => {
        const habilitationsAttendues = { 
          ...habilitationsVides, 
          lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
          'saisie.commentaire': { territoires: ['NAT-FR'], chantiers: [], périmètres: [] },
        };
        await testCasPassant('EQUIPE_DIR_PROJET', habilitationsAttendues, undefined, ['123'], []);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('EQUIPE_DIR_PROJET', ['REG-006']);
      }); 
    });
  });

  describe("L'utilisateur a un profil DIR_PROJET", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de chantiers et une liste de périmètres en lecture, et en lui ajoutant la saisie commentaires pour la France", async () => {
        const habilitationsAttendues = { 
          ...habilitationsVides, 
          lecture: { chantiers: ['123'], territoires: [], périmètres: [] }, 
          'saisie.commentaire': { territoires: ['NAT-FR'], chantiers: [], périmètres: [] },
        };
        await testCasPassant('DIR_PROJET', habilitationsAttendues, undefined, ['123'], []);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('DIR_PROJET', ['REG-006']);
      }); 
    });
  });

  describe("L'utilisateur a un profil REFERENT_REGION", () => {
    const codeRégionParente = 'REG-11';
    const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture", async () => {
        const habilitationsAttendues = { 
          ...habilitationsVides, 
          lecture: { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] }, 
          'saisie.commentaire':  { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
        };
        await testCasPassant('REFERENT_REGION', habilitationsAttendues, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on ne fournis pas de territoires', async () => {
        await testCasErreur('REFERENT_REGION');
      });
      it("renvoi une erreur si on ne fournis pas l'intégralité des départements enfants de la région", async () => {
        await testCasErreur('REFERENT_REGION', [codeRégionParente, codesDépartementsEnfantsDeLaRégion[0]]);
      });
      it('renvoi une erreur si on fournis uniquement des départements', async () => {
        await testCasErreur('REFERENT_REGION', codesDépartementsEnfantsDeLaRégion);
      });
      it("renvoi une erreur si on fournis des département qui n'appartiennent pas aux régions choisies", async () => {
        await testCasErreur('REFERENT_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion, 'DEPT-99']);
      });
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('REFERENT_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('REFERENT_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], undefined, ['456']);
      }); 
    });
  });

  describe("L'utilisateur a un profil PREFET_REGION", () => {
    const codeRégionParente = 'REG-11';
    const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de territoires contenant des régions et leurs départements enfants en lecture", async () => {
        const habilitationsAttendues = { 
          ...habilitationsVides, 
          lecture: { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] }, 
          'saisie.commentaire':  { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
        };
        await testCasPassant('PREFET_REGION', habilitationsAttendues, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion]);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on ne fournis pas de territoires', async () => {
        await testCasErreur('PREFET_REGION');
      });
      it("renvoi une erreur si on ne fournis pas l'intégralité des départements enfants de la région", async () => {
        await testCasErreur('PREFET_REGION', [codeRégionParente, codesDépartementsEnfantsDeLaRégion[0]]);
      });
      it('renvoi une erreur si on fournis uniquement des départements', async () => {
        await testCasErreur('PREFET_REGION', codesDépartementsEnfantsDeLaRégion);
      });
      it("renvoi une erreur si on fournis des département qui n'appartiennent pas aux régions choisies", async () => {
        await testCasErreur('PREFET_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion, 'DEPT-99']);
      });
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('PREFET_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('PREFET_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], undefined, ['456']);
      }); 
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_REGION", () => {
    const codeRégionParente = 'REG-11';
    const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);

    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des régions et leurs départements enfants en lecture et une liste de chantiers territorialisés et une liste de périmètres", async () => {
        const habilitationsAttendues = { 
          ...habilitationsVides, 
          lecture: { chantiers: ['123'], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: ['456'] }, 
          'saisie.commentaire':  { chantiers: [], territoires: [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], périmètres: [] },
        };
        await testCasPassant('SERVICES_DECONCENTRES_REGION', habilitationsAttendues, [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], ['123'], ['456']);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on ne fournis pas de territoires', async () => {
        await testCasErreur('SERVICES_DECONCENTRES_REGION');
      });
      it("renvoi une erreur si on ne fournis pas l'intégralité des départements enfants de la région", async () => {
        await testCasErreur('SERVICES_DECONCENTRES_REGION', [codeRégionParente, codesDépartementsEnfantsDeLaRégion[0]]);
      });
      it('renvoi une erreur si on fournis uniquement des départements', async () => {
        await testCasErreur('SERVICES_DECONCENTRES_REGION', codesDépartementsEnfantsDeLaRégion);
      });
      it("renvoi une erreur si on fournis des département qui n'appartiennent pas aux régions choisies", async () => {
        await testCasErreur('SERVICES_DECONCENTRES_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion, 'DEPT-99']);
      });
      it('renvoi une erreur si on fournis un chantier non territorailisé', async () => {
        testCasErreur('SERVICES_DECONCENTRES_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], ['124'], []);
      });
    });
  });

  describe("L'utilisateur a un profil REFERENT_DEPARTEMENT", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements en lecture", async () => {
        const habilitationsAttendues = { 
          ...habilitationsVides, 
          lecture: { chantiers: [], territoires: ['DEPT-75'], périmètres: [] }, 
          'saisie.commentaire':  { chantiers: [], territoires: ['DEPT-75'], périmètres: [] },
        };
        await testCasPassant('REFERENT_DEPARTEMENT', habilitationsAttendues, ['DEPT-75']);
      });
    });


    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on ne fournis pas de territoires', async () => {
        await testCasErreur('REFERENT_DEPARTEMENT');
      });
      it('renvoi une erreur si on fournis des territoires qui ne sont pas des départements', async () => {
        await testCasErreur('REFERENT_DEPARTEMENT', ['REG-11']);
      });
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('REFERENT_DEPARTEMENT', ['DEPT-75'], ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('REFERENT_DEPARTEMENT', ['DEPT-75'], undefined, ['456']);
      }); 
    });
  });

  describe("L'utilisateur a un profil PREFET_DEPARTEMENT", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements en lecture", async () => {
        const habilitationsAttendues = { 
          ...habilitationsVides, 
          lecture: { chantiers: [], territoires: ['DEPT-75'], périmètres: [] }, 
          'saisie.commentaire':  { chantiers: [], territoires: ['DEPT-75'], périmètres: [] },
        };
        await testCasPassant('PREFET_DEPARTEMENT', habilitationsAttendues, ['DEPT-75']);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on ne fournis pas de territoires', async () => {
        await testCasErreur('PREFET_DEPARTEMENT');
      });
      it('renvoi une erreur si on fournis des territoires qui ne sont pas des départements', async () => {
        await testCasErreur('PREFET_DEPARTEMENT', ['REG-11']);
      });
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('PREFET_DEPARTEMENT', ['DEPT-75'], ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('PREFET_DEPARTEMENT', ['DEPT-75'], undefined, ['456']);
      }); 
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_DEPARTEMENT", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en prenant une liste de terrioires contenant des départements, une liste de chantiers et une liste de périmètres en lecture", async () => {
        const habilitationsAttendues = {
          ...habilitationsVides, 
          lecture: { chantiers: ['123'], territoires: ['DEPT-75'], périmètres: [] }, 
          'saisie.commentaire':  { chantiers: [], territoires: ['DEPT-75'], périmètres: [] },
        };
        await testCasPassant('SERVICES_DECONCENTRES_DEPARTEMENT', habilitationsAttendues, ['DEPT-75'], ['123'], []);
      });
    });


    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on ne fournis pas de territoires', async () => {
        await testCasErreur('SERVICES_DECONCENTRES_DEPARTEMENT');
      });
      it('renvoi une erreur si on fournis des territoires qui ne sont pas des départements', async () => {
        await testCasErreur('SERVICES_DECONCENTRES_DEPARTEMENT', ['REG-11']);
      });
      it('renvoi une erreur si on fournis un chantier non territorailisé', async () => {
        testCasErreur('SERVICES_DECONCENTRES_DEPARTEMENT', ['DEPT-75'], ['124'], []);
      });
    });
  });

  describe("L'utilisateur a un profil DROM", () => {
    describe('Les informations fournies sont correctes', () => {
      it("Crée l'utilisateur en base de données en lui ajoutant les territoires DROM et le périmètre 18 en lecture, et la France en saisie commentaires", async () => {
        const habilitationsAttendues = {
          ...habilitationsVides, 
          'saisie.commentaire':  { chantiers: [], territoires: ['NAT-FR'], périmètres: [] },
          lecture: { chantiers: [], territoires: codesTerritoiresDROM, périmètres: ['PER-018'] },
        };
        await testCasPassant('DROM', habilitationsAttendues);
      });
    });

    describe('Les informations fournies sont incorrectes', () => {
      it('renvoi une erreur si on fourni des territoires personnalisés', async () => {
        await testCasErreur('DROM', ['REG-006']);
      }); 
      it('renvoi une erreur si on fourni des chantiers personnalisés', async () => {
        await testCasErreur('DROM', undefined, ['123']);
      });
      it('renvoi une erreur si on fourni des périmètres personnalisés', async () => {
        await testCasErreur('DROM', undefined, undefined, ['456']);
      }); 
    });
  });
});
