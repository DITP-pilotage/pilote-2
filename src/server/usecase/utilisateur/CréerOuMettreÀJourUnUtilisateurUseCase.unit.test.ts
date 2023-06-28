import { mock } from 'jest-mock-extended';
import { faker } from '@faker-js/faker/locale/fr';
import { UtilisateurIAMRepository } from '@/server/domain/utilisateur/UtilisateurIAMRepository';
import UtilisateurRepository from '@/server/domain/utilisateur/UtilisateurRepository.interface';
import UtilisateurÀCréerOuMettreÀJourBuilder from '@/server/domain/utilisateur/UtilisateurÀCréerOuMettreÀJour.builder';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { fakeTerritoires } from '@/server/domain/territoire/Territoire.builder';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { codesTerritoiresDROM } from '@/validation/utilisateur';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';
import { ChantierSynthétisé } from '@/server/domain/chantier/Chantier.interface';
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

  const stubUtilisateurRepository = { créerOuMettreÀJour: jest.fn() } as unknown as UtilisateurRepository;
  const stubUtilisateurIAMRepository = { ajouteUtilisateurs: jest.fn() } as unknown as UtilisateurIAMRepository;
  const stubTerritoireRepository = { récupérerTous: jest.fn().mockResolvedValue(fakeTerritoires) } as unknown as TerritoireRepository;
  const stubChantierRepository = mock<ChantierRepository>();
  stubChantierRepository.récupérerChantiersSynthétisés.mockResolvedValue(fakeChantiersSynthétisés);

  const créerOuMettreÀJourUnUtilisateurUseCase = new CréerOuMettreÀJourUnUtilisateurUseCase(stubUtilisateurRepository, stubUtilisateurIAMRepository, stubTerritoireRepository, stubChantierRepository);
  const tousLesTerritoiresCodes = fakeTerritoires.map(territoire => territoire.code);
  const tousLesChantiersIds = fakeChantiersSynthétisés.map(chantier => chantier.id);
  const tousLesChantiersTerritorialisésIds = fakeChantiersSynthétisés.filter(c => c.estTerritorialisé).map(chantier => chantier.id);



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

  async function testAccèsTerritoiresEnLectureCasPassant(profilCode: ProfilCode, territoiresCodes: string[], chantiersIds: string[]) {
    //GIVEN
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil(profilCode).avecHabilitationLecture(chantiersIds, territoiresCodes).build();

    //WHEN
    await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto');

    //THEN
    expect(stubUtilisateurRepository.créerOuMettreÀJour).toHaveBeenCalledTimes(1);
    expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenCalledTimes(1);
  }

  async function testAccèsTerritoiresEnLectureCasErreur(profilCode: ProfilCode, territoiresCodes: string[], chantiersIds: string[]) {
    // GIVEN
    const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil(profilCode).avecHabilitationLecture(chantiersIds, territoiresCodes).build();

    // THEN
    await expect(créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto')).rejects.toThrowError();
  }

  

  describe("Si la variable d'env DEV_PASSWORD est définie", () => {
    it("ne créé par l'utilisateur sur Keycloak", async () => {
      // GIVEN 
      process.env.DEV_PASSWORD = 'password';
      const utilisateur = new UtilisateurÀCréerOuMettreÀJourBuilder().avecProfil('SERVICES_DECONCENTRES_REGION').build();

      //WHEN
      await créerOuMettreÀJourUnUtilisateurUseCase.run(utilisateur, 'toto');
        
      //THEN
      expect(stubUtilisateurIAMRepository.ajouteUtilisateurs).toHaveBeenCalledTimes(0);
    });
  });
  
  describe("L'utilisateur a un profil DITP_ADMIN", () => {
    describe("L'utilisateur doit avoir accès à tous les chantiers et tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DITP_ADMIN', tousLesTerritoiresCodes, tousLesChantiersIds);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DITP_ADMIN', [], tousLesChantiersIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DITP_ADMIN', tousLesTerritoiresCodes, []);
      }); 
    });
  });

  describe("L'utilisateur a un profil DITP_PILOTAGE", () => {
    describe("L'utilisateur doit avoir accès à tous les chantiers et tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DITP_PILOTAGE', tousLesTerritoiresCodes, tousLesChantiersIds);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DITP_PILOTAGE', [], tousLesChantiersIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DITP_PILOTAGE', tousLesTerritoiresCodes, []);
      }); 
    });
  });

  describe("L'utilisateur a un profil PR", () => {
    describe("L'utilisateur doit avoir accès à tous les chantiers et tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('PR', tousLesTerritoiresCodes, tousLesChantiersIds);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PR', [], tousLesChantiersIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PR', tousLesTerritoiresCodes, []);
      }); 
    });
  });


  describe("L'utilisateur a un profil PM_ET_CABINET", () => {
    describe("L'utilisateur doit avoir accès à tous les chantiers et tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('PM_ET_CABINET', tousLesTerritoiresCodes, tousLesChantiersIds);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PM_ET_CABINET', [], tousLesChantiersIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PM_ET_CABINET', tousLesTerritoiresCodes, []);
      }); 
    });
  });

  describe("L'utilisateur a un profil CABINET_MTFP", () => {
    describe("L'utilisateur doit avoir accès à tous les chantiers et tous les territoires en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('CABINET_MTFP', tousLesTerritoiresCodes, tousLesChantiersIds);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('CABINET_MTFP', [], tousLesChantiersIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('CABINET_MTFP', tousLesTerritoiresCodes, []);
      }); 
    });
  });

  describe("L'utilisateur a un profil CABINET_MINISTERIEL", () => {
    describe("L'utilisateur doit avoir accès à certains chantiers parmi tous les chantier et à tous les territoires en lecture", () => {
      const chantierIdsAléatoiresParmiTousLesChantiers = faker.helpers.arrayElements(tousLesChantiersIds, 3);

      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('CABINET_MINISTERIEL', tousLesTerritoiresCodes, chantierIdsAléatoiresParmiTousLesChantiers);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('CABINET_MINISTERIEL', [], chantierIdsAléatoiresParmiTousLesChantiers);
      }); 
    });
  });

  describe("L'utilisateur a un profil DIR_ADMIN_CENTRALE", () => {
    describe("L'utilisateur doit avoir accès à certains chantiers parmi tous les chantier et à tous les territoires en lecture", () => {
      const chantierIdsAléatoiresParmiTousLesChantiers = faker.helpers.arrayElements(tousLesChantiersIds, 3);

      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DIR_ADMIN_CENTRALE', tousLesTerritoiresCodes, chantierIdsAléatoiresParmiTousLesChantiers);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DIR_ADMIN_CENTRALE', [], chantierIdsAléatoiresParmiTousLesChantiers);
      }); 
    });
  });

  describe("L'utilisateur a un profil SECRETARIAT_GENERAL", () => {
    describe("L'utilisateur doit avoir accès à certains chantiers parmi tous les chantier et à tous les territoires en lecture", () => {
      const chantierIdsAléatoiresParmiTousLesChantiers = faker.helpers.arrayElements(tousLesChantiersIds, 3);

      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('SECRETARIAT_GENERAL', tousLesTerritoiresCodes, chantierIdsAléatoiresParmiTousLesChantiers);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SECRETARIAT_GENERAL', [], chantierIdsAléatoiresParmiTousLesChantiers);
      }); 
    });
  });

  describe("L'utilisateur a un profil EQUIPE_DIR_PROJET", () => {
    describe("L'utilisateur doit avoir accès à certains chantiers parmi tous les chantier et à tous les territoires en lecture", () => {
      const chantierIdsAléatoiresParmiTousLesChantiers = faker.helpers.arrayElements(tousLesChantiersIds, 3);

      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('EQUIPE_DIR_PROJET', tousLesTerritoiresCodes, chantierIdsAléatoiresParmiTousLesChantiers);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('EQUIPE_DIR_PROJET', [], chantierIdsAléatoiresParmiTousLesChantiers);
      }); 
    });
  });

  describe("L'utilisateur a un profil DIR_PROJET", () => {
    describe("L'utilisateur doit avoir accès à certains chantiers parmi tous les chantier et à tous les territoires en lecture", () => {
      const chantierIdsAléatoiresParmiTousLesChantiers = faker.helpers.arrayElements(tousLesChantiersIds, 3);

      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DIR_PROJET', tousLesTerritoiresCodes, chantierIdsAléatoiresParmiTousLesChantiers);
      });

      it("renvoi une erreur si l'utilisateur n'a pas tous les territoires", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DIR_PROJET', [], chantierIdsAléatoiresParmiTousLesChantiers);
      }); 
    });
  });

  describe("L'utilisateur a un profil REFERENT_REGION", () => {
    describe("L'utilisateur doit avoir accès à 0 ou plusieurs régions ainsi que leurs départements enfants et à tous les chantiers territorialisés", () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
        
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('REFERENT_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], tousLesChantiersTerritorialisésIds);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est ni un département ni une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_REGION', ['NAT-FR'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les départements enfants d'une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_REGION', ['REG-11'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas la région parente d'un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_REGION', ['DEPT-75'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers territorialisés", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], []);
      }); 
    });
  });

  describe("L'utilisateur a un profil PREFET_REGION", () => {
    describe("L'utilisateur doit avoir accès à 0 ou plusieurs régions ainsi que leurs départements enfants et à tous les chantiers territorialisés", () => {
      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);
        
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('PREFET_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], tousLesChantiersTerritorialisésIds);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est ni un département ni une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_REGION', ['NAT-FR'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les départements enfants d'une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_REGION', ['REG-11'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas la région parente d'un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_REGION', ['DEPT-75'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers territorialisés", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], []);
      }); 
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_REGION", () => {
    describe("L'utilisateur doit avoir accès à 0 ou plusieurs régions ainsi que leurs départements enfants et a 0 ou plusieurs chantiers parmi les chantiers territorialisés", () => {
      const chantierIdsAléatoiresParmiTousLesChantiersTerritorialisés = faker.helpers.arrayElements(tousLesChantiersTerritorialisésIds, 3);

      const codeRégionParente = 'REG-11';
      const codesDépartementsEnfantsDeLaRégion = fakeTerritoires.filter(t => t.codeParent === codeRégionParente).map(t => t.code);

      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('SERVICES_DECONCENTRES_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], chantierIdsAléatoiresParmiTousLesChantiersTerritorialisés);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est ni un département ni une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_REGION', ['NAT-FR'], chantierIdsAléatoiresParmiTousLesChantiersTerritorialisés);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les départements enfants d'une région", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_REGION', ['REG-11'], chantierIdsAléatoiresParmiTousLesChantiersTerritorialisés);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas la région parente d'un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_REGION', ['DEPT-75'], chantierIdsAléatoiresParmiTousLesChantiersTerritorialisés);
      }); 

      it("renvoi une erreur si l'utilisateur a un chantier non territorialisé", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_REGION', [codeRégionParente, ...codesDépartementsEnfantsDeLaRégion], [fakeChantiersSynthétisés.find(c => c.estTerritorialisé === false)!.id]);
      }); 
    });
  });

  describe("L'utilisateur a un profil REFERENT_DEPARTEMENT", () => {
    describe("L'utilisateur doit avoir accès à 0 ou plusieurs départements et à tous les chantiers territorialisés en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('REFERENT_DEPARTEMENT', ['DEPT-75'], tousLesChantiersTerritorialisésIds);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est pas un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_DEPARTEMENT', ['NAT-FR'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers territorialisés", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('REFERENT_DEPARTEMENT', ['DEPT-75'], []);
      }); 
    });
  });

  describe("L'utilisateur a un profil PREFET_DEPARTEMENT", () => {
    describe("L'utilisateur doit avoir accès à 0 ou plusieurs départements et à tous les chantiers territorialisés en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('PREFET_DEPARTEMENT', ['DEPT-75'], tousLesChantiersTerritorialisésIds);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est pas un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_DEPARTEMENT', ['NAT-FR'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers territorialisés", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('PREFET_DEPARTEMENT', ['DEPT-75'], []);
      }); 
    });
  });

  describe("L'utilisateur a un profil SERVICES_DECONCENTRES_DEPARTEMENT", () => {
    describe("L'utilisateur doit avoir accès à 0 ou plusieurs départements et a 0 ou plusieurs chantiers parmi les chantiers territorialisés", () => {
      const chantierIdsAléatoiresParmiTousLesChantiersTerritorialisés = faker.helpers.arrayElements(tousLesChantiersTerritorialisésIds, 3);

      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('SERVICES_DECONCENTRES_DEPARTEMENT', ['DEPT-75'], chantierIdsAléatoiresParmiTousLesChantiersTerritorialisés);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est pas un département", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_DEPARTEMENT', ['NAT-FR'], chantierIdsAléatoiresParmiTousLesChantiersTerritorialisés);
      }); 

      it("renvoi une erreur si l'utilisateur a un chantier non territorialisé", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('SERVICES_DECONCENTRES_REGION', ['DEPT-75'], [fakeChantiersSynthétisés.find(c => c.estTerritorialisé === false)!.id]);
      }); 
    });
  });

  describe("L'utilisateur a un profil DROM", () => {
    describe("L'utilisateur doit avoir accès à tous les territoires DROM et le territoire France et tous les chantiers territorialisés en lecture", () => {
      it("Crée l'utilisateur en base et sur keycloak", async () => {
        await testAccèsTerritoiresEnLectureCasPassant('DROM', codesTerritoiresDROM, tousLesChantiersTerritorialisésIds);
      });

      it("renvoi une erreur si l'utilisateur a un territoire qui n'est pas un territoire DROM", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DROM', ['DEPT-75'], tousLesChantiersTerritorialisésIds);
      }); 

      it("renvoi une erreur si l'utilisateur n'a pas tous les chantiers territorialisés", async () => {
        await testAccèsTerritoiresEnLectureCasErreur('DROM', codesTerritoiresDROM, []);
      }); 
    });
  });
});
